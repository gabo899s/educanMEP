import json
from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from .models import Course, Profile, Task, Submission, GradeReview, Institution
from .test_teaching import rubric

class GradingLifecycle(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.users={}
        for role in ['teacher','student','guardian','admin','other']:
            u=User.objects.create_user(role,email=role+'@school.test')
            Profile.objects.create(user=u,role='teacher' if role=='other' else role)
            cls.users[role]=u
        cls.course=Course.objects.create(title='Ciencias',code='SCI',teacher=cls.users['teacher'])
        cls.course.students.add(cls.users['student'])
        cls.task=Task.objects.create(course=cls.course,title='Explorar',due=timezone.localdate(),points=100)
        cls.sub=Submission.objects.create(task=cls.task,student=cls.users['student'],body='Mi investigación')
    def setUp(self):self.client.force_login(self.users['teacher'])
    def post(self,path,data):return self.client.post('/api/'+path,json.dumps(data),content_type='application/json')
    def payload(self,s=None,**extra):
        s=s or self.sub;s.refresh_from_db()
        return {'submission':s.id,'version':s.version,'review_revision':s.review_revision,'grade':82,'feedback':'Amplía tus evidencias',**extra}
    def test_private_draft_does_not_leak_into_student_state_history_or_exports(self):
        self.assertEqual(self.post('grade-draft',self.payload()).status_code,200)
        self.sub.refresh_from_db();self.assertIsNone(self.sub.grade);self.assertEqual(self.sub.feedback,'')
        self.assertTrue(self.client.get('/api/state').json()['submissions'][0]['review_draft'])
        self.client.force_login(self.users['student'])
        data=self.client.get('/api/state').json()['submissions'][0]
        self.assertNotIn('review_draft',data);self.assertIsNone(data['grade'])
        self.assertEqual(self.client.get('/api/submission-history/'+str(self.sub.id)).json()['versions'],[])
        self.assertNotIn('Amplía',self.client.get('/api/grades-export').content.decode())
    def test_publish_draft_records_version_and_student_result(self):
        self.post('grade-draft',self.payload())
        self.assertEqual(self.post('grade-publish',{'reviews':[self.payload()]}).status_code,200)
        self.sub.refresh_from_db();self.assertEqual(self.sub.grade,82);self.assertFalse(GradeReview.objects.exists())
        self.assertEqual(self.sub.versions.get(number=1).feedback,'Amplía tus evidencias')
        self.client.force_login(self.users['student'])
        self.assertEqual(self.client.get('/api/state').json()['submissions'][0]['grade'],82)
    def test_revision_conflict_preserves_newer_draft(self):
        old=self.payload();self.post('grade-draft',old)
        self.assertEqual(self.post('grade-draft',{**old,'grade':10}).status_code,409)
        self.assertEqual(GradeReview.objects.get().grade,82)
    def test_resubmission_invalidates_old_review_and_stale_grade(self):
        old=self.payload();self.post('grade-draft',old)
        self.client.force_login(self.users['student'])
        self.assertEqual(self.post('submit',{'task':self.task.id,'body':'Nueva evidencia','expected_version':1}).status_code,200)
        self.assertFalse(GradeReview.objects.exists())
        self.client.force_login(self.users['teacher'])
        self.assertEqual(self.post('grade',old).status_code,409)
        self.sub.refresh_from_db();self.assertIsNone(self.sub.grade);self.assertEqual(self.sub.version,2)
    def test_duplicate_delivery_does_not_create_extra_version(self):
        self.client.force_login(self.users['student'])
        data={'task':self.task.id,'body':'Nueva evidencia','expected_version':1}
        self.assertEqual(self.post('submit',data).status_code,200)
        self.assertEqual(self.post('submit',data).status_code,409)
        self.sub.refresh_from_db();self.assertEqual(self.sub.version,2)
    def test_group_publish_rolls_back_if_any_review_changed(self):
        t=Task.objects.create(course=self.course,title='Otra actividad',due=timezone.localdate())
        other=Submission.objects.create(task=t,student=self.users['student'],body='Otro trabajo')
        self.post('grade-draft',self.payload());self.post('grade-draft',self.payload(other))
        records=[self.payload(),self.payload(other)]
        self.post('grade-draft',self.payload(other,grade=99))
        self.assertEqual(self.post('grade-publish',{'reviews':records}).status_code,409)
        self.sub.refresh_from_db();self.assertIsNone(self.sub.grade);self.assertEqual(GradeReview.objects.count(),2)
    def test_draft_rubric_uses_server_score_and_criterion_feedback(self):
        self.task.rubric=rubric();self.task.save()
        self.assertEqual(self.post('grade-draft',self.payload(grade=100,rubric_selections={'argument':'high','evidence':'middle'},criterion_feedback={'evidence':'Añade fuentes'})).status_code,200)
        self.assertEqual(GradeReview.objects.get().grade,70)
        self.post('grade-publish',{'reviews':[self.payload()]})
        self.sub.refresh_from_db();self.assertEqual(self.sub.rubric_assessment['feedback']['evidence'],'Añade fuentes')
    def test_roles_and_course_scope_enforced_for_all_review_actions(self):
        for role in ['student','guardian','other']:
            self.client.force_login(self.users[role])
            for path,data in [('grade-draft',self.payload()),('grade-discard',self.payload()),('grade-publish',{'reviews':[self.payload()]})]:
                with self.subTest(role=role,path=path):self.assertEqual(self.post(path,data).status_code,403)
    def test_return_discards_private_draft_and_requires_current_revision(self):
        self.post('grade-draft',self.payload())
        stale=self.payload();self.post('grade-draft',self.payload(grade=90))
        self.assertEqual(self.post('submission-return',{**stale,'message':'Revisa las fuentes'}).status_code,409)
        self.assertEqual(self.post('submission-return',{**self.payload(),'message':'Revisa las fuentes'}).status_code,200)
        self.assertFalse(GradeReview.objects.exists());self.sub.refresh_from_db();self.assertTrue(self.sub.returned)
    def test_discard_keeps_previous_published_result(self):
        self.post('grade',self.payload(grade=60));self.post('grade-draft',self.payload(grade=95))
        self.assertEqual(self.post('grade-discard',self.payload()).status_code,200)
        self.sub.refresh_from_db();self.assertEqual(self.sub.grade,60);self.assertFalse(GradeReview.objects.exists())
    def test_disabled_grades_and_archived_courses_reject_drafts(self):
        i=Institution.objects.create(pk=1,modules={'grades':{'enabled':False}})
        self.assertEqual(self.post('grade-draft',self.payload()).status_code,403)
        i.modules={};i.save();self.course.archived=True;self.course.save()
        self.assertEqual(self.post('grade-draft',self.payload()).status_code,403)
    def test_publish_requires_versions_and_rejects_duplicates(self):
        self.post('grade-draft',self.payload())
        self.assertEqual(self.post('grade-publish',{'reviews':[{'submission':self.sub.id}]}).status_code,400)
        self.assertEqual(self.post('grade-publish',{'reviews':[self.payload(),self.payload()]}).status_code,400)
        self.sub.refresh_from_db();self.assertIsNone(self.sub.grade)
    def test_new_delivery_zero_expected_version_and_legacy_client(self):
        t=Task.objects.create(course=self.course,title='Nueva',due=timezone.localdate())
        self.client.force_login(self.users['student'])
        self.assertEqual(self.post('submit',{'task':t.id,'body':'Primera','expected_version':0}).status_code,200)
        self.assertEqual(self.post('submit',{'task':t.id,'body':'Duplicada','expected_version':0}).status_code,409)
        self.assertEqual(self.post('submit',{'task':t.id,'body':'Cliente anterior'}).status_code,200)
    def test_incomplete_rubric_and_invalid_score_preserve_existing_draft(self):
        self.post('grade-draft',self.payload())
        self.assertEqual(self.post('grade-draft',self.payload(grade=101)).status_code,400)
        self.assertEqual(GradeReview.objects.get().grade,82)

    def test_partial_rubric_review_resumes_without_publishing_a_score(self):
        self.task.rubric=rubric();self.task.save()
        data=self.payload(rubric_selections={'argument':'high','evidence':''},criterion_feedback={'evidence':'Busca una fuente'})
        self.assertEqual(self.post('grade-draft',data).status_code,200)
        draft=GradeReview.objects.get();self.assertIsNone(draft.grade);self.assertEqual(draft.assessment['selections'],{'argument':'high'})
        self.assertEqual(self.post('grade-publish',{'reviews':[self.payload()]}).status_code,400)
        self.sub.refresh_from_db();self.assertIsNone(self.sub.grade)
        complete=self.payload(rubric_selections={'argument':'high','evidence':'middle'},criterion_feedback={'evidence':'Busca una fuente'})
        self.assertEqual(self.post('grade',complete).status_code,200)
        self.sub.refresh_from_db();self.assertEqual(self.sub.grade,70)
    def test_comment_only_draft_is_private_until_score_is_completed(self):
        self.assertEqual(self.post('grade-draft',self.payload(grade='')).status_code,200)
        self.assertIsNone(GradeReview.objects.get().grade)
        self.assertEqual(self.post('grade-publish',{'reviews':[self.payload()]}).status_code,400)
        self.assertEqual(self.post('grade-draft',self.payload(grade=0)).status_code,200)
        self.assertEqual(self.post('grade-publish',{'reviews':[self.payload()]}).status_code,200)
        self.sub.refresh_from_db();self.assertEqual(self.sub.grade,0)
