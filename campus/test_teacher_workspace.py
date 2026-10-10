import json
import tempfile
from datetime import timedelta
from pathlib import Path
from unittest.mock import patch
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from .models import (Profile,Course,Task,Submission,LessonPlan,TeachingLibraryItem,Competency,
                     TaskAdaptation,SubmissionVersion,TutoringSlot,TeacherAIDraft,AIStudySession)
from .ai_provider import ProviderError

class TeacherWorkspaceTests(TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.override=override_settings(MEDIA_ROOT=self.tmp.name);self.override.enable();self.addCleanup(self.override.disable)
        self.users={}
        for role in ['teacher','teacher2','student','student2','admin']:
            u=User.objects.create_user(role,email=role+'@school.edu',password='SecureSchool123!')
            Profile.objects.create(user=u,role='teacher' if role.startswith('teacher') else 'student' if role.startswith('student') else 'admin');self.users[role]=u
        self.teacher=self.users['teacher'];self.student=self.users['student'];self.c=Course.objects.create(title='Biología',code='BIO',teacher=self.teacher)
        self.c.students.add(self.student,self.users['student2']);self.other=Course.objects.create(title='Otra',code='OT',teacher=self.users['teacher2'])
        self.t=Task.objects.create(course=self.c,title='Explorar plantas',description='Observar y reflexionar',due=timezone.localdate(),points=100)
        self.client.force_login(self.teacher)
    def post(self,path,data):return self.client.post('/api/'+path,json.dumps(data),content_type='application/json')
    def as_user(self,role):self.client.force_login(self.users[role])
    def lesson(self,**extra):return self.post('lesson-save',{'course':self.c.id,'title':'Observar','date':str(timezone.localdate()),'objectives':'Identificar hojas','activities':'Observación',**extra})
    def task_data(self,**extra):return {'id':self.t.id,'title':self.t.title,'description':self.t.description,'due':str(self.t.due),**extra}
    def test_lesson_crud_copy_independent_and_author_privacy(self):
        self.assertEqual(self.lesson().status_code,200);p=LessonPlan.objects.get()
        self.assertEqual(self.post('lesson-copy',{'id':p.id,'date':str(p.date+timedelta(days=7))}).status_code,200)
        self.assertEqual(LessonPlan.objects.count(),2)
        self.assertEqual(self.lesson(id=p.id,objectives='Nuevos objetivos').status_code,200)
        self.assertEqual(LessonPlan.objects.exclude(pk=p.id).get().objectives,'Identificar hojas')
        self.as_user('admin');self.assertEqual(self.client.get('/api/state').json()['teacher_workspace']['plans'],[])
        self.assertEqual(self.post('lesson-delete',{'id':p.id}).status_code,403)
        self.as_user('teacher');self.assertEqual(self.post('lesson-delete',{'id':p.id}).status_code,200)
    def test_lesson_course_scope_and_student_denial(self):
        self.assertEqual(self.lesson(course=self.other.id).status_code,403)
        self.as_user('student');self.assertEqual(self.lesson().status_code,403)
    def test_draft_and_scheduled_visibility_all_student_entrypoints(self):
        for mode in ['draft','scheduled']:
            self.as_user('teacher');self.assertEqual(self.post('task-edit',self.task_data(publication=mode,publish_at=(timezone.now()+timedelta(hours=2)).isoformat())).status_code,200)
            self.as_user('student');self.assertEqual(self.client.get('/api/state').json()['tasks'],[])
            for path,d in [('draft',{'task':self.t.id,'body':'Intento'}),('submit',{'task':self.t.id,'body':'Intento'}),('help-ask',{'task':self.t.id,'question':'Ayuda'}),('planner',{'task':self.t.id,'title':'Plan','date':str(timezone.localdate())})]:
                with self.subTest(mode=mode,path=path):self.assertEqual(self.post(path,d).status_code,403)
            session=AIStudySession.objects.create(student=self.student,title='Apuntes')
            self.assertEqual(self.post('ai/source',{'session':session.id,'kind':'classroom','title':'Texto','classroom_type':'task','classroom_id':self.t.id}).status_code,403)
    def test_scheduled_becomes_visible_without_background_worker(self):
        self.t.publication='scheduled';self.t.publish_at=timezone.now()-timedelta(minutes=1);self.t.save()
        self.as_user('student');self.assertEqual(len(self.client.get('/api/state').json()['tasks']),1)
        self.assertEqual(self.post('submit',{'task':self.t.id,'body':'Mi trabajo'}).status_code,200)
    def test_schedule_requires_time_and_started_task_cannot_hide(self):
        self.assertEqual(self.post('task-edit',self.task_data(publication='scheduled')).status_code,400)
        Submission.objects.create(task=self.t,student=self.student,body='Intento')
        self.assertEqual(self.post('task-edit',self.task_data(publication='draft')).status_code,400)
    def test_competency_scope_link_protection_and_student_progress_data(self):
        r=self.post('competency-save',{'course':self.c.id,'title':'Observar','target':75});self.assertEqual(r.status_code,200)
        c=Competency.objects.get();self.assertEqual(self.post('task-edit',self.task_data(competencies=[c.id])).status_code,200)
        other=Competency.objects.create(course=self.other,title='Otra')
        self.assertEqual(self.post('task-edit',self.task_data(competencies=[other.id])).status_code,400)
        self.assertEqual(self.post('competency-delete',{'id':c.id,'course':self.c.id}).status_code,400)
        self.as_user('student');s=self.client.get('/api/state').json();self.assertEqual(s['tasks'][0]['competencies'],[c.id]);self.assertEqual(s['teacher_workspace']['competencies'][0]['target'],75)
    def test_competency_delete_unlinked(self):
        c=Competency.objects.create(course=self.c,title='No usada');self.assertEqual(self.post('competency-delete',{'id':c.id,'course':self.c.id}).status_code,200)
    def test_private_adaptation_and_effective_deadline(self):
        self.t.due=timezone.localdate()-timedelta(days=2);self.t.allow_late=False;self.t.save()
        due=timezone.localdate()+timedelta(days=2)
        self.assertEqual(self.post('task-adaptation',{'task':self.t.id,'student':self.student.id,'due':str(due),'instructions':'Usa otro ejemplo','private_notes':'Nota reservada'}).status_code,200)
        self.as_user('student');r=self.client.get('/api/state').json();self.assertEqual(r['tasks'][0]['due'],str(due));self.assertEqual(r['tasks'][0]['adapted_instructions'],'Usa otro ejemplo');self.assertNotIn('Nota reservada',json.dumps(r))
        self.assertEqual(self.post('submit',{'task':self.t.id,'body':'Mi análisis'}).status_code,200)
        self.as_user('student2');r=self.client.get('/api/state').json();self.assertEqual(r['tasks'][0]['adapted_instructions'],'');self.assertEqual(self.post('submit',{'task':self.t.id,'body':'Mi análisis'}).status_code,400)
    def test_adaptation_membership_permission_delete(self):
        self.assertEqual(self.post('task-adaptation',{'task':self.t.id,'student':self.users['teacher2'].id}).status_code,400)
        self.as_user('student');self.assertEqual(self.post('task-adaptation',{'task':self.t.id,'student':self.student.id}).status_code,403)
        self.as_user('teacher');self.post('task-adaptation',{'task':self.t.id,'student':self.student.id,'instructions':'Otro texto'})
        self.assertEqual(self.post('adaptation-delete',{'task':self.t.id,'student':self.student.id}).status_code,200);self.assertEqual(TaskAdaptation.objects.count(),0)
    def test_return_resubmit_version_grades_comments_and_history(self):
        self.as_user('student');self.assertEqual(self.post('submit',{'task':self.t.id,'body':'Primera versión'}).status_code,200);s=Submission.objects.get()
        self.as_user('teacher');self.assertEqual(self.post('grade',{'submission':s.id,'grade':65,'feedback':'Falta evidencia'}).status_code,200)
        self.assertEqual(self.post('submission-return',{'submission':s.id,'message':'Revisa los ejemplos'}).status_code,200)
        self.assertEqual(self.post('grade',{'submission':s.id,'grade':70}).status_code,400)
        self.as_user('student');self.assertEqual(self.post('submit',{'task':self.t.id,'body':'Segunda versión'}).status_code,200)
        s.refresh_from_db();self.assertEqual(s.version,2);self.assertFalse(s.returned);self.assertIsNone(s.grade)
        history=self.client.get('/api/submission-history/'+str(s.id)).json()['versions'];self.assertEqual([v['number'] for v in history],[2,1]);self.assertEqual(history[1]['grade'],65);self.assertEqual(history[1]['return_message'],'Revisa los ejemplos');self.assertEqual(history[1]['feedback'],'Falta evidencia')
        self.as_user('student2');self.assertEqual(self.client.get('/api/submission-history/'+str(s.id)).status_code,403)
        self.as_user('teacher2');self.assertEqual(self.client.get('/api/submission-history/'+str(s.id)).status_code,403)
    def test_version_files_survive_replacing_original_and_remain_private(self):
        self.as_user('student');self.client.post('/api/submit',{'task':self.t.id,'body':'Versión1','file':SimpleUploadedFile('uno.txt',b'original')});s=Submission.objects.get();v=SubmissionVersion.objects.get(number=1)
        with self.captureOnCommitCallbacks(execute=True):self.client.post('/api/submit',{'task':self.t.id,'body':'Versión2','file':SimpleUploadedFile('dos.txt',b'updated')})
        response=self.client.get('/api/version-file/'+str(v.id));self.assertEqual(b''.join(response.streaming_content),b'original')
        self.as_user('student2');self.assertEqual(self.client.get('/api/version-file/'+str(v.id)).status_code,403)
    def test_library_task_copies_rubric_fields_as_draft(self):
        self.assertEqual(self.post('library-save',{'kind':'task','source':self.t.id,'title':'X','folder':'Unidad1','tags':['biología']}).status_code,200)
        r=TeachingLibraryItem.objects.get();self.t.description='Cambio';self.t.save()
        self.assertEqual(self.post('library-publish',{'id':r.id,'course':self.c.id,'due':str(timezone.localdate())}).status_code,200)
        t=Task.objects.exclude(pk=self.t.id).get();self.assertEqual(t.description,'Observar y reflexionar');self.assertEqual(t.publication,'draft')
    def test_library_resource_file_and_copy_are_independent(self):
        r=self.client.post('/api/library-save',{'title':'Guía','body':'Contenido','kind':'resource','folder':'Unidad','tags':'["lectura"]','file':SimpleUploadedFile('guia.txt',b'guia')});self.assertEqual(r.status_code,200)
        item=TeachingLibraryItem.objects.get();self.assertEqual(self.post('library-publish',{'id':item.id,'course':self.c.id}).status_code,200)
        from .models import Resource
        material=Resource.objects.get();self.assertNotEqual(material.file.name,item.file.name)
        self.as_user('student');self.assertEqual(self.client.get('/api/library-file/'+str(item.id)).status_code,403);self.assertEqual(self.client.get('/api/resource-file/'+str(material.id)).status_code,200)
        self.as_user('admin');self.assertEqual(self.client.get('/api/library-file/'+str(item.id)).status_code,403)
    def test_library_private_crud_and_target_course_scope(self):
        self.post('library-save',{'title':'Guía','body':'Leer','kind':'resource'});item=TeachingLibraryItem.objects.get()
        self.assertEqual(self.post('library-publish',{'id':item.id,'course':self.other.id}).status_code,403)
        self.as_user('teacher2');self.assertEqual(self.post('library-delete',{'id':item.id}).status_code,403)
        self.as_user('admin');self.assertEqual(self.client.get('/api/state').json()['teacher_workspace']['library'],[])
        self.as_user('teacher');self.assertEqual(self.post('library-delete',{'id':item.id}).status_code,200)
    def slot(self,**extra):return self.post('tutoring-save',{'course':self.c.id,'starts':(timezone.now()+timedelta(days=1)).isoformat(),'minutes':30,'location':'Biblioteca',**extra})
    def test_tutoring_book_release_and_private_question_agreement(self):
        self.assertEqual(self.slot().status_code,200);s=TutoringSlot.objects.get()
        self.as_user('student');self.assertEqual(self.post('tutoring-book',{'id':s.id,'question':'Mi duda privada'}).status_code,200)
        self.as_user('student2');self.assertNotIn('Mi duda privada',json.dumps(self.client.get('/api/state').json()));self.assertEqual(self.post('tutoring-book',{'id':s.id,'question':'Otra duda'}).status_code,400)
        self.assertEqual(self.post('tutoring-release',{'id':s.id}).status_code,403)
        self.as_user('teacher');self.assertEqual(self.post('tutoring-agreement',{'id':s.id,'agreement':'Repasar conceptos'}).status_code,200)
        self.as_user('student');self.assertEqual(self.client.get('/api/state').json()['teacher_workspace']['slots'][0]['agreement'],'Repasar conceptos')
        self.assertEqual(self.post('tutoring-release',{'id':s.id}).status_code,200);s.refresh_from_db();self.assertIsNone(s.student_id)
    def test_tutoring_overlap_and_past_validation(self):
        self.assertEqual(self.slot().status_code,200);self.assertEqual(self.slot().status_code,400);self.assertEqual(self.slot(starts=(timezone.now()-timedelta(days=1)).isoformat()).status_code,400)
    def test_tutoring_cancel_reserved_and_reassignment_scope(self):
        self.slot();s=TutoringSlot.objects.get();s.student=self.student;s.save()
        self.assertEqual(self.post('tutoring-cancel',{'id':s.id}).status_code,200)
        self.as_user('student');self.assertTrue(self.client.get('/api/state').json()['teacher_workspace']['slots'][0]['cancelled']);self.assertEqual(self.post('tutoring-book',{'id':s.id,'question':'Otra'}).status_code,400)
        self.c.teacher=self.users['teacher2'];self.c.save();self.assertEqual(self.client.get('/api/state').json()['teacher_workspace']['slots'],[])
    @override_settings(LUMA_NVIDIA_API_KEY='')
    def test_teacher_ai_no_key_truthful_and_student_denied(self):
        d={'title':'Clase','kind':'plan','course':self.c.id,'prompt':'Prepara una clase'}
        self.assertEqual(self.post('teacher-ai/generate',d).status_code,503)
        self.as_user('student');self.assertEqual(self.post('teacher-ai/generate',d).status_code,403)
        self.assertEqual(TeacherAIDraft.objects.count(),0)
    @override_settings(LUMA_NVIDIA_API_KEY='server-key')
    @patch('campus.ai_provider.completion',return_value='Borrador de clase revisable')
    def test_teacher_ai_separate_policy_private_drafts_manual_review(self,provider):
        r=self.post('teacher-ai/generate',{'title':'Clase','kind':'plan','course':self.c.id,'prompt':'Prepara conceptos'});self.assertEqual(r.status_code,200);a=TeacherAIDraft.objects.get()
        self.assertEqual(Task.objects.count(),1);self.assertEqual(Submission.objects.count(),0);self.assertEqual(a.status,'draft')
        prompt=str(provider.call_args);self.assertIn('No decidas notas',prompt);self.assertNotIn('server-key',prompt)
        self.assertEqual(self.post('teacher-ai-save',{'id':a.id,'title':'Revisado','content':'Ajustado por docente','status':'reviewed'}).status_code,200)
        self.as_user('admin');self.assertEqual(self.client.get('/api/state').json()['teacher_workspace']['ai_drafts'],[]);self.assertEqual(self.post('teacher-ai-delete',{'id':a.id}).status_code,403)
        self.as_user('teacher');self.assertEqual(self.post('teacher-ai-delete',{'id':a.id}).status_code,200)
    @override_settings(LUMA_NVIDIA_API_KEY='server-key')
    @patch('campus.ai_provider.completion',side_effect=ProviderError('No hay conexión'))
    def test_teacher_ai_provider_failure_does_not_create_fake_draft(self,_):
        self.assertEqual(self.post('teacher-ai/generate',{'title':'Clase','kind':'plan','course':self.c.id,'prompt':'Ideas'}).status_code,503);self.assertEqual(TeacherAIDraft.objects.count(),0)
    def test_new_teacher_operations_require_csrf(self):
        from django.test import Client
        c=Client(enforce_csrf_checks=True);c.force_login(self.teacher);self.assertEqual(c.post('/api/lesson-save',{'course':self.c.id}).status_code,403)
    def test_preparation_never_creates_demo_and_deactivates_legacy_accounts(self):
        import runpy
        from contextlib import redirect_stdout
        from io import StringIO
        demo=User.objects.create_user('old-demo',email='profe@luma.demo',password='LegacyDemoPassword');Profile.objects.create(user=demo,role='teacher')
        count=User.objects.count()
        with redirect_stdout(StringIO()):runpy.run_path(str(Path(__file__).resolve().parent.parent/'seed.py'))
        demo.refresh_from_db();self.assertFalse(demo.is_active);self.assertEqual(User.objects.count(),count);self.assertTrue(self.teacher.is_active)
        self.as_user('admin');self.assertNotIn('profe@luma.demo',json.dumps(self.client.get('/api/state').json()['administration']))
        self.assertEqual(self.post('user',{'name':'Prueba retirada','email':'nuevo@luma.demo','role':'student','password':'AnotherPassword123'}).status_code,400)
    def test_studio_disabled_blocks_new_teacher_operations(self):
        from .models import Institution
        Institution.objects.create(modules={'studio':False})
        self.assertEqual(self.lesson().status_code,400)
