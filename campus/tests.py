import json
from datetime import date
from django.test import TestCase,Client,override_settings
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from tempfile import TemporaryDirectory
from .models import *

class CampusFlows(TestCase):
    def setUp(self):
        self.users={}
        for role in ['student','teacher','admin']:
            u=User.objects.create_user(role,email=role+'@test.edu',password='testpassword123',first_name=role)
            Profile.objects.create(user=u,role=role)
            self.users[role]=u
        self.c=Course.objects.create(title='Biología',code='BIO',teacher=self.users['teacher'])
        self.c.students.add(self.users['student'])
        self.t=Task.objects.create(course=self.c,title='Células',description='Investiga',due=date.today())
        self.client.force_login(self.users['student'])
    def post(self,path,d,client=None):return (client or self.client).post('/api/'+path,json.dumps(d),content_type='application/json')
    def test_authentication_required(self):
        self.client.logout();self.assertEqual(self.client.get('/api/state').status_code,401)
        self.assertEqual(self.post('login',{'email':'student@test.edu','password':'wrong'}).status_code,401)
        self.assertEqual(self.post('login',{'email':'student@test.edu','password':'testpassword123'}).status_code,200)
    def test_csrf_enforced(self):
        c=Client(enforce_csrf_checks=True);c.force_login(self.users['student'])
        self.assertEqual(self.post('message',{'recipient':self.users['teacher'].id,'body':'Hola'},c).status_code,403)
    def test_student_cannot_manage(self):
        self.assertEqual(self.post('task',{'course':self.c.id,'title':'No','description':'No','due':str(date.today())}).status_code,403)
        self.assertEqual(self.post('user',{}).status_code,403)
        self.assertEqual(self.post('course',{}).status_code,403)
    def test_submission_then_grade(self):
        self.assertEqual(self.post('submit',{'task':self.t.id,'body':'Mi respuesta'}).status_code,200)
        s=Submission.objects.get();self.assertEqual(s.student,self.users['student'])
        self.assertEqual(self.post('grade',{'submission':s.id,'grade':80}).status_code,403)
        self.client.force_login(self.users['teacher'])
        self.assertEqual(self.post('grade',{'submission':s.id,'grade':101}).status_code,400)
        self.assertEqual(self.post('grade',{'submission':s.id,'grade':94,'feedback':'Buen trabajo'}).status_code,200)
        self.client.force_login(self.users['student']);self.assertEqual(self.client.get('/api/state').json()['submissions'][0]['grade'],94)
        self.assertEqual(self.post('submit',{'task':self.t.id,'body':'Editar'}).status_code,400)
    def test_messages_between_real_accounts(self):
        self.assertEqual(self.post('message',{'recipient':self.users['teacher'].id,'body':'¿Repasamos?'}).status_code,200)
        self.client.force_login(self.users['teacher']);data=self.client.get('/api/state').json();self.assertEqual(data['messages'][0]['body'],'¿Repasamos?')
        self.post('read',{'sender':self.users['student'].id});self.assertTrue(Message.objects.get().read)
        self.client.force_login(self.users['admin']);self.assertEqual(self.client.get('/api/state').json()['messages'],[])
    def test_course_scope(self):
        outsider=User.objects.create_user('outsider',password='test');Profile.objects.create(user=outsider,role='teacher')
        private=Course.objects.create(title='Privada',code='PRI',teacher=outsider)
        self.assertEqual(self.post('post',{'course':private.id,'body':'Acceso'}).status_code,403)
        self.client.force_login(outsider)
        self.assertEqual(self.post('task',{'course':self.c.id,'title':'No','description':'No','due':str(date.today())}).status_code,403)
    def test_admin_create_user_course_and_enroll(self):
        self.client.force_login(self.users['admin'])
        self.assertEqual(self.post('user',{'name':'Emma Castro','email':'emma@test.edu','password':'testpassword123','role':'student'}).status_code,200)
        emma=User.objects.get(email='emma@test.edu');self.assertTrue(emma.check_password('testpassword123'))
        self.assertEqual(self.post('course',{'title':'Arte','code':'ART','teacher':self.users['teacher'].id,'students':[emma.id]}).status_code,200)
        self.assertTrue(Course.objects.get(code='ART').students.filter(id=emma.id).exists())
    def test_attendance_and_resource_validation(self):
        self.client.force_login(self.users['teacher'])
        self.assertEqual(self.post('attendance',{'course':self.c.id,'date':str(date.today()),'rows':[{'student':self.users['student'].id,'present':False}]}).status_code,200)
        self.assertFalse(Attendance.objects.get().present)
        self.assertEqual(self.post('resource',{'course':self.c.id,'title':'Mal','url':'javascript:alert(1)'}).status_code,400)
    def test_profile_cannot_change_role(self):
        self.assertEqual(self.post('profile',{'name':'Nuevo Nombre','bio':'Hola','role':'admin'}).status_code,200)
        self.users['student'].refresh_from_db();self.assertEqual(self.users['student'].profile.role,'student')
    def test_file_authorization(self):
        with TemporaryDirectory() as temp, override_settings(MEDIA_ROOT=temp):
            f=SimpleUploadedFile('trabajo.txt',b'Contenido')
            self.assertEqual(self.client.post('/api/submit',{'task':self.t.id,'body':'Adjunto','file':f}).status_code,200)
            s=Submission.objects.get();self.assertEqual(self.client.get('/api/file/'+str(s.id)).status_code,200)
            outsider=User.objects.create_user('other',password='test');Profile.objects.create(user=outsider,role='student')
            self.c.students.add(outsider);self.client.force_login(outsider)
            self.assertEqual(self.client.get('/api/file/'+str(s.id)).status_code,403)

    def test_draft_persists_without_becoming_submission(self):
        self.assertEqual(self.post('draft', {'task': self.t.id, 'body': 'Estoy trabajando'}).status_code, 200)
        self.assertFalse(Submission.objects.exists())
        self.assertEqual(self.client.get('/api/state').json()['drafts'][0]['body'], 'Estoy trabajando')
        self.post('submit', {'task': self.t.id, 'body': 'Trabajo terminado'})
        self.assertFalse(Draft.objects.exists())

    def test_closed_activity_rejects_delivery_and_draft(self):
        self.client.force_login(self.users['teacher'])
        self.assertEqual(self.post('task-toggle', {'id': self.t.id, 'closed': True}).status_code, 200)
        self.client.force_login(self.users['student'])
        self.assertEqual(self.post('submit', {'task': self.t.id, 'body': 'Entrega'}).status_code, 400)
        self.assertEqual(self.post('draft', {'task': self.t.id, 'body': 'Borrador'}).status_code, 400)
        self.assertFalse(Submission.objects.exists())

    def test_edit_task_preserves_existing_grades(self):
        Submission.objects.create(task=self.t, student=self.users['student'], body='Trabajo', grade=90)
        self.client.force_login(self.users['teacher'])
        data={'id': self.t.id, 'title': 'Título nuevo', 'description': 'Nuevas instrucciones', 'due': str(date.today()), 'points': 50}
        self.assertEqual(self.post('task-edit', data).status_code, 400)
        self.t.refresh_from_db(); self.assertEqual(self.t.title, 'Células')
        data['points']=100
        self.assertEqual(self.post('task-edit', data).status_code, 200)
        self.assertEqual(Submission.objects.get().grade, 90)

    def test_favorite_is_persistent_and_course_scoped(self):
        self.assertEqual(self.post('favorite', {'course': self.c.id, 'favorite': True}).status_code, 200)
        self.assertEqual(self.client.get('/api/state').json()['me']['preferences']['favorites'], [self.c.id])
        private=Course.objects.create(title='Otra aula', code='OTHER', teacher=self.users['teacher'])
        self.assertEqual(self.post('favorite', {'course': private.id, 'favorite': True}).status_code, 403)
        self.post('favorite', {'course': self.c.id, 'favorite': False})
        self.assertEqual(self.client.get('/api/state').json()['me']['preferences']['favorites'], [])

    def test_state_etag_and_private_cache(self):
        response=self.client.get('/api/state')
        self.assertEqual(self.client.get('/api/state', HTTP_IF_NONE_MATCH=response['ETag']).status_code, 304)
        self.post('post', {'course': self.c.id, 'body': 'Nuevo contenido'})
        refreshed=self.client.get('/api/state', HTTP_IF_NONE_MATCH=response['ETag'])
        self.assertEqual(refreshed.status_code, 200)
        self.assertNotEqual(refreshed['ETag'], response['ETag'])
        self.assertIn('private', refreshed['Cache-Control'])

    def test_state_queries_do_not_grow_per_course(self):
        from django.db import connection
        from django.test.utils import CaptureQueriesContext
        self.client.force_login(self.users['admin'])
        with CaptureQueriesContext(connection) as before:
            self.client.get('/api/state')
        for i in range(20):
            c=Course.objects.create(title=f'Aula {i}', code=f'A-{i}', teacher=self.users['teacher'])
            c.students.add(self.users['student'])
        with CaptureQueriesContext(connection) as after:
            self.client.get('/api/state')
        self.assertLessEqual(len(after), len(before)+1)

    def test_resource_file_download_is_authorized(self):
        with TemporaryDirectory() as temp, override_settings(MEDIA_ROOT=temp):
            self.client.force_login(self.users['teacher'])
            response=self.client.post('/api/resource', {'course': self.c.id, 'title': 'Guía', 'body': '', 'url': '', 'file': SimpleUploadedFile('guia.txt', b'Una guia')})
            self.assertEqual(response.status_code, 200)
            r=Resource.objects.get()
            self.client.force_login(self.users['student'])
            self.assertEqual(self.client.get('/api/resource-file/'+str(r.id)).status_code, 200)
            outside=User.objects.create_user('outside', password='password123')
            Profile.objects.create(user=outside, role='student')
            self.client.force_login(outside)
            self.assertEqual(self.client.get('/api/resource-file/'+str(r.id)).status_code, 403)

    def test_oversized_resource_creates_nothing(self):
        self.client.force_login(self.users['teacher'])
        f=SimpleUploadedFile('grande.txt', b'x'*(5*1024*1024+1))
        response=self.client.post('/api/resource', {'course': self.c.id, 'title': 'Grande', 'file': f})
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Resource.objects.exists())

    def test_post_edits_and_pinning_respect_ownership(self):
        p=Post.objects.create(course=self.c, author=self.users['teacher'], body='Aviso')
        self.assertEqual(self.post('post-edit', {'id': p.id, 'body': 'Intrusión'}).status_code, 403)
        self.assertEqual(self.post('post-pin', {'id': p.id, 'pinned': True}).status_code, 403)
        self.client.force_login(self.users['teacher'])
        self.assertEqual(self.post('post-pin', {'id': p.id, 'pinned': True}).status_code, 200)
        self.assertTrue(self.client.get('/api/state').json()['posts'][0]['pinned'])

    def test_events_can_only_be_edited_by_creator_or_admin(self):
        self.client.force_login(self.users['teacher'])
        response=self.post('event', {'title':'Encuentro','date':str(date.today()),'time':'10:00','kind':'Campus','description':'Un encuentro'})
        self.assertEqual(response.status_code,200)
        event=Event.objects.get()
        other=User.objects.create_user('otherteacher', password='password123')
        Profile.objects.create(user=other, role='teacher')
        self.client.force_login(other)
        self.assertEqual(self.post('event-delete', {'id':event.id}).status_code,403)
        self.client.force_login(self.users['admin'])
        self.assertEqual(self.post('event-delete', {'id':event.id}).status_code,200)

    def test_admin_can_edit_account_without_changing_role(self):
        self.client.force_login(self.users['admin'])
        response=self.post('user-edit', {'id':self.users['student'].id,'name':'Nombre actualizado','email':'nuevo@test.edu','password':'newpassword123','role':'admin'})
        self.assertEqual(response.status_code,200)
        student=User.objects.get(id=self.users['student'].id)
        self.assertEqual(student.profile.role,'student')
        self.assertTrue(student.check_password('newpassword123'))
        self.assertTrue(self.c.students.filter(id=student.id).exists())

    def test_attendance_is_atomic_and_rejects_ambiguous_booleans(self):
        self.client.force_login(self.users['teacher'])
        rows=[{'student':self.users['student'].id,'present':True}, {'student':999999,'present':False}]
        self.assertEqual(self.post('attendance',{'course':self.c.id,'date':str(date.today()),'rows':rows}).status_code,400)
        self.assertFalse(Attendance.objects.exists())
        rows=[{'student':self.users['student'].id,'present':'false'}]
        self.assertEqual(self.post('attendance',{'course':self.c.id,'date':str(date.today()),'rows':rows}).status_code,400)

    def test_grade_export_is_private_and_prevents_csv_formulas(self):
        other=User.objects.create_user('otherstudent',password='password123',first_name='=HYPERLINK("evil")')
        Profile.objects.create(user=other,role='student')
        self.c.students.add(other)
        Submission.objects.create(task=self.t,student=self.users['student'],body='Mi trabajo',grade=91)
        Submission.objects.create(task=self.t,student=other,body='Otro',grade=89,feedback='=COMMAND()')
        response=self.client.get('/api/grades-export')
        self.assertEqual(response.status_code,200)
        self.assertNotIn('HYPERLINK',response.content.decode())
        self.client.force_login(self.users['teacher'])
        response=self.client.get('/api/grades-export')
        self.assertIn("'=COMMAND()",response.content.decode())
        self.assertIn('private',response['Cache-Control'])

    def test_directory_does_not_disclose_other_phones(self):
        self.users['teacher'].profile.phone='12345678'
        self.users['teacher'].profile.save()
        response=self.client.get('/api/state').json()
        self.assertTrue(all('phone' not in p for p in response['people']))
        self.assertIn('phone',response['me'])

    def test_malformed_json_array_is_rejected(self):
        response=self.client.post('/api/message','[]',content_type='application/json')
        self.assertEqual(response.status_code,400)
        self.assertFalse(Message.objects.exists())

    def test_empty_resource_is_not_created(self):
        self.client.force_login(self.users['teacher'])
        self.assertEqual(self.post('resource',{'course':self.c.id,'title':'Sin contenido','url':'','body':''}).status_code,400)
        self.assertFalse(Resource.objects.exists())

    def test_weak_gzip_etag_is_revalidated(self):
        response=self.client.get('/api/state',HTTP_ACCEPT_ENCODING='gzip')
        self.assertEqual(response.status_code,200)
        self.assertEqual(response['Content-Encoding'],'gzip')
        response=self.client.get('/api/state',HTTP_ACCEPT_ENCODING='gzip',HTTP_IF_NONE_MATCH=response['ETag'])
        self.assertEqual(response.status_code,304)

from django.test import TransactionTestCase
from django.db.migrations.executor import MigrationExecutor
from django.db import connection

class UpgradePreservesData(TransactionTestCase):
    def test_upgrade_preserves_users_courses_and_grades(self):
        executor=MigrationExecutor(connection)
        executor.migrate([('campus','0001_initial')])
        old=executor.loader.project_state([('campus','0001_initial')]).apps
        U=old.get_model('auth','User');P=old.get_model('campus','Profile')
        C=old.get_model('campus','Course');T=old.get_model('campus','Task');S=old.get_model('campus','Submission')
        teacher=U.objects.create(username='originalteacher',first_name='Original')
        student=U.objects.create(username='originalstudent')
        P.objects.create(user_id=teacher.id,role='teacher');P.objects.create(user_id=student.id,role='student')
        c=C.objects.create(title='Aula existente',code='EXISTING',teacher_id=teacher.id)
        c.students.add(student)
        t=T.objects.create(course_id=c.id,title='Trabajo existente',description='Preservar',due=date.today(),points=100)
        submitted=S.objects.create(task_id=t.id,student_id=student.id,body='Datos originales',grade=98,feedback='Conservar')
        executor=MigrationExecutor(connection)
        executor.migrate([('campus','0002_event_author_post_pinned_profile_preferences_and_more')])
        self.assertEqual(Submission.objects.get(id=submitted.id).grade,98)
        self.assertEqual(Submission.objects.get(id=submitted.id).body,'Datos originales')
        self.assertTrue(Course.objects.get(id=c.id).students.filter(id=student.id).exists())
        self.assertEqual(Profile.objects.get(user_id=student.id).preferences,{})
        self.assertFalse(Task.objects.get(id=t.id).closed)
