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
