import json
import struct
import zlib
from datetime import date
from tempfile import TemporaryDirectory
from django.test import TestCase, Client, override_settings
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import Profile, Course, Task, Submission, Institution, AdministrationLog
from .administration import institution_state, MODULES

class AdministrationFlows(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.users={}
        for role in ['admin','teacher','student']:
            u=User.objects.create_user(role,email=role+'@test.edu',password='testpassword123',first_name=role)
            Profile.objects.create(user=u,role=role,phone='privado '+role)
            cls.users[role]=u
        cls.course=Course.objects.create(title='Arte',code='ARTE',teacher=cls.users['teacher'])
        cls.course.students.add(cls.users['student'])
        cls.task=Task.objects.create(course=cls.course,title='Proyecto',description='Crear',due=date.today())
        cls.submission=Submission.objects.create(task=cls.task,student=cls.users['student'],body='Original',grade=95)
    def setUp(self): self.client.force_login(self.users['admin'])
    def post(self,path,data): return self.client.post('/api/'+path,json.dumps(data),content_type='application/json')
    def settings(self): return institution_state()
    def test_all_new_admin_actions_denied_to_other_roles(self):
        actions=['institution','institution-logo','institution-logo-delete','course-archive','teacher-assign','membership-bulk','user-status','user-details','user-role']
        for role in ['student','teacher']:
            self.client.force_login(self.users[role])
            for action in actions:
                with self.subTest(role=role,action=action): self.assertEqual(self.post(action,{}).status_code,403)
            self.assertEqual(self.client.get('/api/people-export').status_code,403)
            self.assertIsNone(self.client.get('/api/state').json()['administration'])
        self.assertEqual(AdministrationLog.objects.count(),0)
    def test_public_branding_does_not_expose_people_or_contacts(self):
        self.client.logout();data=self.client.get('/api/institution').json()
        self.assertEqual(data['name'],'Mi institución')
        self.assertEqual(set(data),{'name','short_name','motto','year','primary','secondary','logo','modules','sections'})
        self.assertEqual(self.client.get('/api/people-export').status_code,401)
    def test_branding_persists_for_all_profiles_and_logs(self):
        d=self.settings();d.update(name='Colegio Jacaranda Azul',short_name='Jacaranda',primary='#335d89',secondary='#d7e7f3',year='2027 / I')
        self.assertEqual(self.post('institution',d).status_code,200)
        self.client.force_login(self.users['student']);s=self.client.get('/api/state').json()
        self.assertEqual(s['institution']['name'],d['name']);self.assertNotIn('phone',s['people'][0])
        self.assertEqual(AdministrationLog.objects.get().actor,self.users['admin'])
    def test_invalid_identity_is_atomic(self):
        for primary in ['red','#ffffff','#000000; color:red']:
            d=self.settings();d.update(name='No guardar',primary=primary)
            self.assertEqual(self.post('institution',d).status_code,400)
            self.assertEqual(Institution.objects.get().name,'Mi institución')
        self.assertEqual(AdministrationLog.objects.count(),0)
    def test_core_modules_cannot_be_disabled_or_forged(self):
        d=self.settings();d['modules']['classroom']['enabled']=False
        self.assertEqual(self.post('institution',d).status_code,400)
        d=self.settings();d['modules']['newadmin']={'enabled':True,'label':'Poder'}
        self.assertEqual(self.post('institution',d).status_code,400)
        d=self.settings();d['modules']['messages']['enabled']='false'
        self.assertEqual(self.post('institution',d).status_code,400)
    def test_modules_disable_server_actions_and_reenable_preserves_data(self):
        d=self.settings()
        for key in MODULES: d['modules'][key]['enabled']=False
        self.assertEqual(self.post('institution',d).status_code,200)
        self.client.force_login(self.users['teacher'])
        for path,data in [('message',{'recipient':self.users['student'].id,'body':'No'}),('grade',{'submission':self.submission.id,'grade':80}),('event',{}),('attendance',{}),('resource',{}),('post',{}),('teaching-template',{})]:
            with self.subTest(action=path): self.assertEqual(self.post(path,data).status_code,403)
        self.assertEqual(self.client.get('/api/grades-export').status_code,403)
        self.assertEqual(self.client.get('/api/resource-file/99999').status_code,403)
        self.submission.refresh_from_db();self.assertEqual(self.submission.grade,95)
        self.client.force_login(self.users['admin']);d=self.settings();d['modules']['grades']['enabled']=True
        self.assertEqual(self.post('institution',d).status_code,200)
        self.client.force_login(self.users['teacher']);self.assertEqual(self.post('grade',{'submission':self.submission.id,'grade':90}).status_code,200)
    def test_sections_validate_links_and_limits(self):
        d=self.settings();d['sections']=[{'title':'Biblioteca','body':'Nuestros libros','url':'https://example.edu/libros'}]
        self.assertEqual(self.post('institution',d).status_code,200)
        d['sections'][0]['url']='javascript:alert(1)';self.assertEqual(self.post('institution',d).status_code,400)
        self.assertEqual(Institution.objects.get().sections[0]['url'],'https://example.edu/libros')
        d['sections']=[{'title':'T','body':'Texto','url':''}]*7;self.assertEqual(self.post('institution',d).status_code,400)
    def test_admin_fiche_has_no_private_preferences(self):
        p=self.users['teacher'].profile;p.preferences={'private':'No compartir'};p.save()
        data=self.client.get('/api/state').json();t=next(p for p in data['administration']['people'] if p['id']==self.users['teacher'].id)
        self.assertEqual(t['phone'],'privado teacher');self.assertNotIn('preferences',t)
        self.assertEqual(self.post('user-details',{'id':self.users['teacher'].id,'phone':'8888','department':'Ciencias','identifier':'DOC-10','bio':'Docente'}).status_code,200)
        self.users['teacher'].profile.refresh_from_db();self.assertEqual(self.users['teacher'].profile.preferences,{'private':'No compartir'})
    def test_bulk_enrollment_add_remove_replace_preserve_grades(self):
        student=User.objects.create_user('new');Profile.objects.create(user=student,role='student')
        second=Course.objects.create(title='Ciencias',code='SCI',teacher=self.users['teacher'])
        self.assertEqual(self.post('membership-bulk',{'courses':[self.course.id,second.id],'students':[student.id],'mode':'add'}).status_code,200)
        self.assertTrue(self.course.students.filter(id=self.users['student'].id).exists())
        self.assertTrue(second.students.filter(id=student.id).exists())
        self.assertEqual(self.post('membership-bulk',{'courses':[self.course.id,second.id],'students':[student.id],'mode':'replace'}).status_code,200)
        self.assertFalse(self.course.students.filter(id=self.users['student'].id).exists())
        self.assertEqual(self.post('membership-bulk',{'courses':[self.course.id,second.id],'students':[student.id],'mode':'remove'}).status_code,200)
        self.assertEqual(self.course.students.count(),0)
        self.submission.refresh_from_db();self.assertEqual(self.submission.grade,95)
    def test_bulk_invalid_input_never_partially_changes_courses(self):
        original=list(self.course.students.values_list('id',flat=True))
        for courses,members,mode in [([self.course.id,999999],[self.users['student'].id],'replace'),([self.course.id],[self.users['teacher'].id],'replace'),([self.course.id],[],'replace'),([self.course.id],[self.users['student'].id],'erase')]:
            self.assertEqual(self.post('membership-bulk',{'courses':courses,'students':members,'mode':mode}).status_code,400)
            self.assertEqual(list(self.course.students.values_list('id',flat=True)),original)
    def test_teacher_reassignment_updates_scope_without_losing_data(self):
        teacher=User.objects.create_user('teacher2');Profile.objects.create(user=teacher,role='teacher')
        self.assertEqual(self.post('teacher-assign',{'teacher':teacher.id,'courses':[self.course.id]}).status_code,200)
        self.client.force_login(self.users['teacher']);self.assertEqual(self.client.get('/api/state').json()['courses'],[])
        self.client.force_login(teacher);data=self.client.get('/api/state').json()
        self.assertEqual(data['submissions'][0]['grade'],95);self.assertEqual(data['courses'][0]['students'],[self.users['student'].id])
    def test_teacher_cannot_be_disabled_until_active_courses_are_reassigned(self):
        self.assertEqual(self.post('user-status',{'id':self.users['teacher'].id,'active':False}).status_code,400)
        self.users['teacher'].refresh_from_db();self.assertTrue(self.users['teacher'].is_active)
    def test_disable_reactivate_blocks_existing_session_and_login(self):
        other=Client();other.force_login(self.users['student'])
        self.assertEqual(self.post('user-status',{'id':self.users['student'].id,'active':False}).status_code,200)
        self.assertEqual(other.get('/api/state').status_code,401)
        self.assertEqual(other.post('/api/login',json.dumps({'email':'student@test.edu','password':'testpassword123'}),content_type='application/json').status_code,401)
        self.assertEqual(self.post('user-status',{'id':self.users['student'].id,'active':True}).status_code,200)
        self.assertEqual(other.post('/api/login',json.dumps({'email':'student@test.edu','password':'testpassword123'}),content_type='application/json').status_code,200)
        self.assertTrue(self.course.students.filter(id=self.users['student'].id).exists())
    def test_admin_cannot_disable_or_demote_self(self):
        self.assertEqual(self.post('user-status',{'id':self.users['admin'].id,'active':False}).status_code,400)
        self.assertEqual(self.post('user-role',{'id':self.users['admin'].id,'role':'student'}).status_code,400)
    def test_role_change_enforces_server_permissions_in_existing_session(self):
        other=Client();other.force_login(self.users['student'])
        self.assertEqual(self.post('user-role',{'id':self.users['student'].id,'role':'teacher'}).status_code,200)
        data=other.get('/api/state').json();self.assertIn('assignments.manage',data['me']['permissions']);self.assertNotIn('institution.manage',data['me']['permissions'])
        self.assertEqual(self.post('user-role',{'id':self.users['teacher'].id,'role':'student'}).status_code,400)
        self.assertEqual(self.post('user-role',{'id':self.users['student'].id,'role':'student'}).status_code,200)
        self.assertNotIn('assignments.manage',other.get('/api/state').json()['me']['permissions'])
    def test_archive_restore_preserves_data_and_blocks_academic_writes(self):
        self.assertEqual(self.post('course-archive',{'id':self.course.id,'archived':True}).status_code,200)
        self.assertEqual(self.post('task',{'course':self.course.id}).status_code,400)
        self.assertEqual(self.post('post',{'course':self.course.id,'body':'No editar archivo'}).status_code,400)
        self.assertEqual(self.post('membership',{'course':self.course.id,'students':[]}).status_code,400)
        self.assertEqual(self.post('membership-bulk',{'courses':[self.course.id],'students':[self.users['student'].id],'mode':'remove'}).status_code,400)
        for role in ['student','teacher']:
            self.client.force_login(self.users[role]);self.assertEqual(self.client.get('/api/state').json()['courses'],[])
        self.client.force_login(self.users['admin']);self.assertEqual(self.post('course-archive',{'id':self.course.id,'archived':False}).status_code,200)
        self.client.force_login(self.users['student']);data=self.client.get('/api/state').json();self.assertEqual(data['submissions'][0]['grade'],95)
    def test_csv_export_is_private_and_formula_safe(self):
        p=self.users['student'];p.first_name='=cmd';p.save()
        response=self.client.get('/api/people-export')
        self.assertEqual(response.status_code,200);self.assertIn("'=cmd",response.content.decode());self.assertEqual(response['Cache-Control'],'private, no-store')
    def test_log_records_actor_and_excludes_passwords(self):
        self.assertEqual(self.post('user',{'name':'Nuevo','email':'nuevo@test.edu','password':'secretpassword123','role':'student'}).status_code,200)
        log=AdministrationLog.objects.get();self.assertNotIn('secretpassword',log.summary);self.assertEqual(log.actor,self.users['admin'])
        self.assertEqual(self.post('user',{}).status_code,400);self.assertEqual(AdministrationLog.objects.count(),1)
    @staticmethod
    def png():
        def chunk(k,d): return struct.pack('>I',len(d))+k+d+struct.pack('>I',zlib.crc32(k+d)&0xffffffff)
        return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',1,1,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(b'\x00\xff\x00\xff\xff'))+chunk(b'IEND',b'')
    def test_logo_upload_public_read_replacement_delete(self):
        with TemporaryDirectory() as folder, override_settings(MEDIA_ROOT=folder):
            for _ in range(2):
                response=self.client.post('/api/institution-logo',{'file':SimpleUploadedFile('my-logo.png',self.png(),content_type='image/png')})
                self.assertEqual(response.status_code,200)
            public=Client().get('/api/institution-logo');self.assertEqual(public.status_code,200);self.assertEqual(public['Content-Type'],'image/png')
            self.assertEqual(b''.join(public.streaming_content),self.png())
            self.assertEqual(self.post('institution-logo-delete',{}).status_code,200)
            self.assertEqual(Client().get('/api/institution-logo').status_code,404)
    def test_logo_rejects_svg_broken_png_dimensions_and_oversize(self):
        self.settings()
        wide=bytearray(self.png());wide[16:20]=struct.pack('>I',4096);wide[29:33]=struct.pack('>I',zlib.crc32(wide[12:29])&0xffffffff)
        for data in [b'<svg onload="alert(1)"></svg>',self.png()[:-2],bytes(wide),b'x'*(2*1024*1024+1)]:
            with self.subTest(size=len(data)):
                self.assertEqual(self.client.post('/api/institution-logo',{'file':SimpleUploadedFile('logo.png',data)}).status_code,400)
        self.assertFalse(Institution.objects.get().logo)
