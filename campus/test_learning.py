import json
from datetime import date
from tempfile import TemporaryDirectory
from django.test import TestCase, Client, override_settings
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection
from django.test.utils import CaptureQueriesContext
from .models import *
from .learning import HOME_CARDS

class StudentLearningFlows(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.users={}
        for key,role in [('s1','student'),('s2','student'),('t1','teacher'),('t2','teacher'),('a','admin')]:
            u=User.objects.create_user(key,email=key+'@test.edu',password='testpassword123',first_name=key)
            Profile.objects.create(user=u,role=role);cls.users[key]=u
        cls.c=Course.objects.create(title='Arte',code='ART',teacher=cls.users['t1'])
        cls.c.students.add(cls.users['s1'],cls.users['s2'])
        cls.other=Course.objects.create(title='Privada',code='PRIVATE',teacher=cls.users['t2']);cls.other.students.add(cls.users['s2'])
        cls.t=Task.objects.create(course=cls.c,title='Collage',description='Crear',due=date.today(),points=100)
        cls.other_task=Task.objects.create(course=cls.other,title='Fuera de alcance',description='No',due=date.today())
        cls.s=Submission.objects.create(task=cls.t,student=cls.users['s1'],body='Mi trabajo original',grade=82,feedback='Prueba más ejemplos',answers={'reflection':'Aprendí'})
    def setUp(self):self.client.force_login(self.users['s1'])
    def post(self,path,d,client=None):return (client or self.client).post('/api/'+path,json.dumps(d),content_type='application/json')
    def space(self):return self.client.get('/api/state').json()['student_space']
    def plan(self,**extra):return {'title':'Repasar','kind':'study','date':str(date.today()),'time':'14:00','duration':30,'priority':'high','remind_minutes':15,'notes':'Mi tiempo','course':self.c.id,**extra}
    def goal(self,**extra):return {'title':'Leer y reflexionar','due':str(date.today()),'target':3,'progress':0,'unit':'sesiones','course':self.c.id,'reflection':'Mi propósito',**extra}
    def note(self,**extra):return {'title':'Mis apuntes','body':'Mi definición privada','course':self.c.id,'tags':['ideas'],**extra}
    def portfolio(self,**extra):return {'title':'Mi primer proyecto','course':self.c.id,'reflection':'Mi proceso','tags':['creatividad'],'sharing':'private',**extra}
    def test_private_space_is_student_only_even_for_admin(self):
        self.post('planner',self.plan());self.post('goal',self.goal());self.post('note',self.note());self.post('portfolio',self.portfolio())
        for key in ['s2','t1','t2','a']:
            self.client.force_login(self.users[key]);data=self.client.get('/api/state').json()
            if key=='s2':
                for field in ['planner','goals','notes','portfolio']:self.assertEqual(data['student_space'][field],[])
            else:self.assertIsNone(data['student_space'])
            if key!='t1' and key!='t2':self.assertIsNone(data['learning_received'])
            else:self.assertEqual(data['learning_received']['portfolio'],[])
    def test_other_profiles_cannot_mutate_student_records(self):
        for key in ['t1','a']:
            self.client.force_login(self.users[key])
            for action in ['planner','planner-edit','planner-toggle','planner-delete','goal','goal-edit','goal-progress','goal-delete','note','note-edit','note-pin','note-delete','portfolio','portfolio-edit','portfolio-delete','student-settings','feedback-read','help-ask','help-status']:
                with self.subTest(profile=key,action=action):self.assertEqual(self.post(action,{}).status_code,403)
    def test_cross_student_mutations_are_denied(self):
        self.post('planner',self.plan());self.post('goal',self.goal());self.post('note',self.note());self.post('portfolio',self.portfolio())
        p,g,n,a=PlannerEntry.objects.get(),LearningGoal.objects.get(),StudentNote.objects.get(),PortfolioEntry.objects.get()
        self.client.force_login(self.users['s2'])
        for path,data in [('planner-edit',self.plan(id=p.id)),('planner-toggle',{'id':p.id,'completed':True}),('planner-delete',{'id':p.id}),('goal-edit',self.goal(id=g.id)),('goal-progress',{'id':g.id,'progress':1}),('goal-delete',{'id':g.id}),('note-edit',self.note(id=n.id)),('note-pin',{'id':n.id,'pinned':True}),('note-delete',{'id':n.id}),('portfolio-edit',self.portfolio(id=a.id)),('portfolio-delete',{'id':a.id})]:
            with self.subTest(action=path):self.assertEqual(self.post(path,data).status_code,403)
        self.assertEqual(StudentNote.objects.count(),1)
    def test_planner_create_edit_toggle_delete_and_course_task_link(self):
        self.assertEqual(self.post('planner',self.plan(task=self.t.id)).status_code,200)
        p=PlannerEntry.objects.get();self.assertEqual(p.task,self.t)
        self.assertEqual(self.post('planner-edit',self.plan(id=p.id,title='Repaso actualizado',kind='reminder')).status_code,200)
        self.assertEqual(self.post('planner-toggle',{'id':p.id,'completed':True}).status_code,200)
        self.assertTrue(self.space()['planner'][0]['completed'])
        self.assertEqual(self.post('planner-delete',{'id':p.id}).status_code,200);self.assertEqual(PlannerEntry.objects.count(),0)
        self.assertEqual(Task.objects.get(id=self.t.id).due,self.t.due)
    def test_planner_validates_types_dates_times_bounds_and_scope(self):
        for extra in [{'kind':'fake'},{'priority':'urgent'},{'date':'2026-02-30'},{'time':'25:00'},{'duration':True},{'duration':0},{'remind_minutes':16},{'course':self.other.id},{'task':self.other_task.id}]:
            with self.subTest(extra=extra):self.assertIn(self.post('planner',self.plan(**extra)).status_code,[400,403])
        self.assertEqual(PlannerEntry.objects.count(),0)
    def test_goal_progress_cannot_change_official_grade(self):
        self.assertEqual(self.post('goal',self.goal()).status_code,200);g=LearningGoal.objects.get()
        self.assertEqual(self.post('goal-progress',{'id':g.id,'progress':2,'grade':100}).status_code,200)
        g.refresh_from_db();self.assertEqual(g.progress,2);self.s.refresh_from_db();self.assertEqual(self.s.grade,82)
        self.assertEqual(self.post('goal-progress',{'id':g.id,'progress':4}).status_code,400)
        self.assertEqual(self.post('goal-progress',{'id':g.id,'progress':-1}).status_code,400)
        self.assertEqual(self.post('goal-edit',self.goal(id=g.id,progress=3,target=3)).status_code,200)
        self.assertEqual(self.post('goal-delete',{'id':g.id}).status_code,200)
    def test_goal_invalid_or_outside_course_is_not_created(self):
        for extra in [{'target':0},{'progress':5},{'course':self.other.id},{'due':'not-date'}]:
            self.assertIn(self.post('goal',self.goal(**extra)).status_code,[400,403])
        self.assertEqual(LearningGoal.objects.count(),0)
    def test_notes_edit_pin_search_data_export_and_delete(self):
        self.assertEqual(self.post('note',self.note(body='Texto\n\nSegunda idea')).status_code,200);n=StudentNote.objects.get()
        self.assertEqual(self.post('note-pin',{'id':n.id,'pinned':True}).status_code,200)
        self.assertTrue(self.space()['notes'][0]['pinned'])
        self.assertEqual(self.post('note-edit',self.note(id=n.id,body='Actualizado',tags=['examen','ideas'])).status_code,200)
        r=self.client.get('/api/notes-export');self.assertEqual(r.status_code,200);self.assertIn('Actualizado',r.content.decode());self.assertEqual(r['Cache-Control'],'private, no-store')
        self.assertEqual(self.client.get('/api/notes-export/'+str(n.id)).status_code,200)
        self.assertEqual(self.post('note-delete',{'id':n.id}).status_code,200)
    def test_notes_export_never_leaks_to_admin_teacher_or_another_student(self):
        self.post('note',self.note());n=StudentNote.objects.get()
        for key in ['s2','t1','a']:
            self.client.force_login(self.users[key]);self.assertEqual(self.client.get('/api/notes-export/'+str(n.id)).status_code,403)
            if key=='s2':self.assertNotIn('Mi definición privada',self.client.get('/api/notes-export').content.decode())
            else:self.assertEqual(self.client.get('/api/notes-export').status_code,403)
    def test_notes_validate_content_tags_and_course(self):
        for extra in [{'body':''},{'body':'x'*20001},{'tags':'fake'},{'tags':['x']*2},{'tags':['long'*10]},{'course':self.other.id}]:
            self.assertIn(self.post('note',self.note(**extra)).status_code,[400,403])
        self.assertEqual(StudentNote.objects.count(),0)
    def test_personal_records_survive_course_removal_and_can_still_be_edited(self):
        self.post('note',self.note());self.post('goal',self.goal());self.post('planner',self.plan(task=self.t.id))
        n,g,p=StudentNote.objects.get(),LearningGoal.objects.get(),PlannerEntry.objects.get()
        self.c.students.remove(self.users['s1'])
        self.assertEqual(len(self.space()['notes']),1)
        self.assertEqual(self.post('note-edit',self.note(id=n.id,body='Sigue siendo mío')).status_code,200)
        self.assertEqual(self.post('goal-edit',self.goal(id=g.id,title='Meta conservada')).status_code,200)
        self.assertEqual(self.post('planner-edit',self.plan(id=p.id,title='Plan conservado',task=self.t.id)).status_code,200)
        self.assertEqual(self.post('note',self.note()).status_code,403)
    def test_portfolio_defaults_private_and_sharing_is_deliberate(self):
        self.assertEqual(self.post('portfolio',self.portfolio()).status_code,200);p=PortfolioEntry.objects.get();self.assertEqual(p.sharing,'private')
        self.client.force_login(self.users['t1']);self.assertEqual(self.client.get('/api/state').json()['learning_received']['portfolio'],[])
        self.client.force_login(self.users['s1']);self.assertEqual(self.post('portfolio-edit',self.portfolio(id=p.id,sharing='teacher')).status_code,200)
        self.client.force_login(self.users['t1']);self.assertEqual(len(self.client.get('/api/state').json()['learning_received']['portfolio']),1)
        for key in ['t2','a','s2']:
            self.client.force_login(self.users[key]);data=self.client.get('/api/state').json();self.assertNotIn('Mi proceso',json.dumps(data))
    def test_portfolio_file_access_follows_sharing_membership_and_assignment(self):
        with TemporaryDirectory() as folder,override_settings(MEDIA_ROOT=folder):
            self.assertEqual(self.client.post('/api/portfolio',{**self.portfolio(),'tags':'[]','file':SimpleUploadedFile('mi-proyecto.txt',b'mi archivo privado')}).status_code,200)
            p=PortfolioEntry.objects.get();url='/api/portfolio-file/'+str(p.id)
            r=self.client.get(url);self.assertEqual(b''.join(r.streaming_content),b'mi archivo privado')
            for key in ['s2','t1','t2','a']:
                self.client.force_login(self.users[key]);self.assertEqual(self.client.get(url).status_code,403)
            self.client.force_login(self.users['s1']);self.post('portfolio-edit',self.portfolio(id=p.id,sharing='teacher'))
            self.client.force_login(self.users['t1']);self.assertEqual(self.client.get(url).status_code,200)
            self.c.teacher=self.users['t2'];self.c.save()
            self.assertEqual(self.client.get(url).status_code,403)
            self.client.force_login(self.users['t2']);self.assertEqual(self.client.get(url).status_code,200)
            self.c.students.remove(self.users['s1']);self.assertEqual(self.client.get(url).status_code,403)
            self.client.force_login(self.users['s1']);self.assertEqual(self.client.get(url).status_code,200)
    def test_portfolio_revoke_share_and_delete_preserve_submission(self):
        self.post('portfolio',self.portfolio(sharing='teacher',submission=self.s.id));p=PortfolioEntry.objects.get()
        self.assertEqual(p.artifact['body'],'Mi trabajo original')
        self.assertEqual(self.post('portfolio-edit',self.portfolio(id=p.id,sharing='private',submission=self.s.id)).status_code,200)
        self.client.force_login(self.users['t1']);self.assertEqual(self.client.get('/api/state').json()['learning_received']['portfolio'],[])
        self.client.force_login(self.users['s1']);self.assertEqual(self.post('portfolio-delete',{'id':p.id}).status_code,200);self.assertTrue(Submission.objects.filter(id=self.s.id).exists())
    def test_portfolio_source_copy_preserves_file_and_body_when_original_changes(self):
        with TemporaryDirectory() as folder,override_settings(MEDIA_ROOT=folder):
            self.s.file=SimpleUploadedFile('original.txt',b'original');self.s.original_name='original.txt';self.s.save()
            self.assertEqual(self.post('portfolio',self.portfolio(submission=self.s.id,reflection='')).status_code,200)
            p=PortfolioEntry.objects.get();self.assertNotEqual(p.file.name,self.s.file.name);self.assertEqual(p.artifact['body'],'Mi trabajo original')
            self.s.body='Ahora distinto';self.s.file.delete();self.s.save()
            r=self.client.get('/api/portfolio-file/'+str(p.id));self.assertEqual(b''.join(r.streaming_content),b'original')
            p.refresh_from_db();self.assertEqual(p.artifact['body'],'Mi trabajo original')
    def test_portfolio_rejects_outside_source_sharing_and_oversized_upload(self):
        other=Submission.objects.create(task=self.t,student=self.users['s2'],body='Otro')
        self.assertEqual(self.post('portfolio',self.portfolio(submission=other.id)).status_code,404)
        for extra in [{'sharing':'public'},{'sharing':'teacher','course':None},{'course':self.other.id},{'reflection':''}]:
            self.assertIn(self.post('portfolio',self.portfolio(**extra)).status_code,[400,403])
        self.assertEqual(self.client.post('/api/portfolio',{**self.portfolio(),'tags':'[]','file':SimpleUploadedFile('grande.bin',b'x'*(5*1024*1024+1))}).status_code,400)
        self.assertEqual(PortfolioEntry.objects.count(),0)
    def test_feedback_read_is_private_and_new_grade_invalidates_receipt(self):
        self.assertNotIn(self.s.id,self.space()['feedback_seen'])
        self.assertEqual(self.post('feedback-read',{'submission':self.s.id}).status_code,200);self.assertIn(self.s.id,self.space()['feedback_seen'])
        self.client.force_login(self.users['s2']);self.assertEqual(self.post('feedback-read',{'submission':self.s.id}).status_code,404)
        self.client.force_login(self.users['t1']);self.assertEqual(self.post('grade',{'submission':self.s.id,'grade':88,'feedback':'Un comentario nuevo'}).status_code,200)
        self.client.force_login(self.users['s1']);self.assertNotIn(self.s.id,self.space()['feedback_seen']);self.s.refresh_from_db();self.assertIsNotNone(self.s.reviewed_at)
    def test_student_preferences_persist_without_changing_role_or_favorites(self):
        p=self.users['s1'].profile;p.preferences={'favorites':[self.c.id],'custom':'conservar'};p.save()
        d={'avatar':'leaf','cover':'constellation','interests':['Ciencia','Arte'],'home_order':list(reversed(HOME_CARDS)),'home_hidden':['notes'],'appearance':{'accent':'green','font_size':'extra','high_contrast':True,'reduce_motion':True,'density':'compact'},'role':'admin'}
        self.assertEqual(self.post('student-settings',d).status_code,200);data=self.client.get('/api/state').json()
        self.assertEqual(data['me']['role'],'student');self.assertEqual(data['me']['avatar'],'leaf');self.assertEqual(data['me']['preferences']['favorites'],[self.c.id]);self.assertEqual(data['me']['preferences']['custom'],'conservar');self.assertTrue(data['me']['preferences']['appearance']['high_contrast'])
        public=next(p for p in data['people'] if p['id']==self.users['s1'].id);self.assertEqual(public['avatar'],'leaf');self.assertNotIn('preferences',public)
    def test_invalid_preferences_are_atomic(self):
        for d in [{'avatar':'<script>'},{'cover':'fake'},{'home_order':['tasks']},{'home_hidden':HOME_CARDS},{'interests':['x']*9},{'appearance':{'font_size':'huge'}},{'appearance':{'high_contrast':'true'}}]:
            self.assertEqual(self.post('student-settings',d).status_code,400)
        self.users['s1'].profile.refresh_from_db();self.assertEqual(self.users['s1'].profile.preferences,{})
    def test_appearance_preserves_student_preferences_and_accessibility(self):
        self.post('student-settings',{'avatar':'sun','cover':'sunrise','interests':['Lectura'],'appearance':{'font_size':'large','high_contrast':True}})
        self.assertEqual(self.post('appearance',{'accent':'blue','density':'compact','reduce_motion':True}).status_code,200)
        p=self.client.get('/api/state').json()['me']['preferences'];self.assertEqual(p['student']['avatar'],'sun');self.assertEqual(p['appearance']['font_size'],'large');self.assertTrue(p['appearance']['high_contrast'])
    def test_help_thread_student_teacher_privacy_and_resolution(self):
        self.assertEqual(self.post('help-ask',{'task':self.t.id,'question':'¿Cómo relacionar los ejemplos?'}).status_code,200);h=HelpRequest.objects.get()
        self.client.force_login(self.users['t1']);data=self.client.get('/api/state').json();self.assertEqual(data['learning_received']['help'][0]['question'],h.question)
        self.assertEqual(self.post('help-reply',{'id':h.id,'body':'Puedes empezar por un caso cotidiano.'}).status_code,200);h.refresh_from_db();self.assertEqual(h.status,'answered')
        self.assertEqual(self.post('help-status',{'id':h.id,'status':'resolved'}).status_code,403)
        self.client.force_login(self.users['s1']);self.assertEqual(len(self.space()['help'][0]['replies']),1)
        self.assertEqual(self.post('help-reply',{'id':h.id,'body':'¿Serviría este ejemplo?'}).status_code,200);h.refresh_from_db();self.assertEqual(h.status,'open')
        self.assertEqual(self.post('help-status',{'id':h.id,'status':'resolved'}).status_code,200)
        self.assertEqual(self.post('help-reply',{'id':h.id,'body':'No'}).status_code,400)
        self.assertEqual(self.post('help-status',{'id':h.id,'status':'open'}).status_code,200)
    def test_help_files_and_replies_are_not_visible_to_admin_or_peers(self):
        with TemporaryDirectory() as folder,override_settings(MEDIA_ROOT=folder):
            self.assertEqual(self.client.post('/api/help-ask',{'task':self.t.id,'question':'Mi duda','file':SimpleUploadedFile('duda.txt',b'privado')}).status_code,200);h=HelpRequest.objects.get();url='/api/help-file/'+str(h.id)
            self.assertEqual(self.client.get(url).status_code,200)
            self.client.force_login(self.users['t1']);self.assertEqual(self.client.get(url).status_code,200)
            for key in ['a','s2','t2']:
                self.client.force_login(self.users[key]);self.assertEqual(self.client.get(url).status_code,403);self.assertEqual(self.post('help-reply',{'id':h.id,'body':'No leer'}).status_code,403)
    def test_help_outside_scope_and_disabled_messages(self):
        self.assertEqual(self.post('help-ask',{'task':self.other_task.id,'question':'No'}).status_code,403)
        self.post('help-ask',{'task':self.t.id,'question':'Sí'});h=HelpRequest.objects.get()
        self.c.students.remove(self.users['s1']);self.assertEqual(self.post('help-reply',{'id':h.id,'body':'No'}).status_code,403);self.assertEqual(len(self.space()['help']),1)
        i=Institution.objects.get(pk=1);i.modules={'messages':{'enabled':False,'label':'Mensajes'}};i.save()
        self.assertEqual(self.post('help-ask',{'task':self.t.id,'question':'No'}).status_code,403)
        self.client.force_login(self.users['t1']);self.assertEqual(self.post('help-reply',{'id':h.id,'body':'No'}).status_code,403)
    def test_timetable_is_teacher_scoped_and_student_read_only(self):
        rows=[{'weekday':0,'start':'08:00','end':'09:00','room':'Aula 2'}]
        self.assertEqual(self.post('course-timetable',{'course':self.c.id,'timetable':rows}).status_code,403)
        self.client.force_login(self.users['t2']);self.assertEqual(self.post('course-timetable',{'course':self.c.id,'timetable':rows}).status_code,403)
        self.client.force_login(self.users['t1']);self.assertEqual(self.post('course-timetable',{'course':self.c.id,'timetable':rows}).status_code,200)
        self.client.force_login(self.users['s1']);self.assertEqual(self.client.get('/api/state').json()['courses'][0]['timetable'],rows)
    def test_timetable_rejects_overlap_invalid_dates_and_types(self):
        self.client.force_login(self.users['t1'])
        for rows in [[{'weekday':True,'start':'08:00','end':'09:00','room':''}],[{'weekday':7,'start':'08:00','end':'09:00','room':''}],[{'weekday':0,'start':'25:00','end':'26:00','room':''}],[{'weekday':0,'start':'10:00','end':'09:00','room':''}],[{'weekday':0,'start':'08:00','end':'09:00','room':''},{'weekday':0,'start':'08:30','end':'09:30','room':''}]]:
            self.assertEqual(self.post('course-timetable',{'course':self.c.id,'timetable':rows}).status_code,400)
        self.c.refresh_from_db();self.assertEqual(self.c.timetable,[])
    def test_learning_queries_do_not_grow_per_course_or_help_request(self):
        self.post('help-ask',{'task':self.t.id,'question':'Primera'})
        self.client.force_login(self.users['t1'])
        with CaptureQueriesContext(connection) as before:self.client.get('/api/state')
        for i in range(20):
            h=HelpRequest.objects.create(student=self.users['s1'],task=self.t,question='Duda '+str(i));HelpReply.objects.create(request=h,author=self.users['t1'],body='Respuesta')
        with CaptureQueriesContext(connection) as after:self.client.get('/api/state')
        self.assertLessEqual(len(after),len(before)+1)
