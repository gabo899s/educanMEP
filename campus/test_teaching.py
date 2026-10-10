import json
from copy import deepcopy
from datetime import date
from django.contrib.auth.models import User
from django.test import TestCase
from .models import Course, Draft, Profile, Submission, Task, TeachingTemplate


def rubric():
    return {'title':'Proyecto con evidencia','criteria':[
        {'id':'argument','title':'Argumentación','description':'Conecta las ideas','levels':[
            {'id':'high','label':'Logrado','description':'Idea clara','points':4},
            {'id':'middle','label':'En proceso','description':'Falta conexión','points':2},
            {'id':'zero','label':'Por iniciar','description':'Sin evidencia','points':0}]},
        {'id':'evidence','title':'Evidencias','levels':[
            {'id':'high','label':'Logrado','description':'Evidencia suficiente','points':6},
            {'id':'middle','label':'En proceso','points':3},
            {'id':'zero','label':'Por iniciar','points':0}]}]}


def fields():
    return [
        {'id':'mode','label':'Modalidad','type':'choice','options':['Individual','Equipo'],'required':True},
        {'id':'members','label':'Integrantes','type':'text','required':True,'show_if':{'field':'mode','equals':'Equipo'}},
        {'id':'hours','label':'Horas dedicadas','type':'number','min':0,'max':20,'required':True},
        {'id':'reflection','label':'Reflexión','type':'textarea','required':True}]


class TeachingFlows(TestCase):
    def setUp(self):
        self.users={}
        for role in ['student','teacher','admin']:
            u=User.objects.create_user(role,email=role+'@test.edu',password='testpassword123')
            Profile.objects.create(user=u,role=role);self.users[role]=u
        self.c=Course.objects.create(title='Biología',code='BIO',teacher=self.users['teacher'])
        self.c.students.add(self.users['student'])
        self.t=Task.objects.create(course=self.c,title='Proyecto',description='Investiga',due=date.today(),points=73)
        self.client.force_login(self.users['teacher'])
    def post(self,path,data):
        return self.client.post('/api/'+path,json.dumps(data),content_type='application/json')
    def template(self,kind='rubric',definition=None):
        definition=definition if definition is not None else rubric() if kind=='rubric' else fields()
        return self.post('teaching-template',{'title':'Mi herramienta','kind':kind,'definition':definition})
    def attach(self,r=None,f=None):
        self.t.rubric=r or {};self.t.fields=f or [];self.t.save()
    def task_data(self,**kwargs):
        return {'id':self.t.id,'title':self.t.title,'description':self.t.description,'due':str(self.t.due),'points':self.t.points,**kwargs}

    def test_library_is_private_even_to_administration(self):
        self.assertEqual(self.template().status_code,200)
        t=TeachingTemplate.objects.get()
        self.assertEqual(len(self.client.get('/api/state').json()['teaching_templates']),1)
        self.client.force_login(self.users['admin'])
        self.assertEqual(self.client.get('/api/state').json()['teaching_templates'],[])
        self.assertEqual(self.post('teaching-template-edit',{'id':t.id,'title':'No','definition':rubric()}).status_code,403)
        self.assertEqual(self.post('teaching-template-delete',{'id':t.id}).status_code,403)
        self.assertTrue(TeachingTemplate.objects.filter(id=t.id).exists())

    def test_student_cannot_customize_teaching_or_templates(self):
        self.client.force_login(self.users['student'])
        for path in ['teaching-template','teaching-template-edit','teaching-template-delete','teaching-preferences']:
            with self.subTest(path=path):self.assertEqual(self.post(path,{}).status_code,403)
        self.assertNotIn('teaching.customize',self.client.get('/api/state').json()['me']['permissions'])

    def test_rubric_definition_is_validated(self):
        invalid=[{}, {'title':'Vacía','criteria':[]}]
        r=rubric();r['criteria'][0]['levels'][2]['points']=1;invalid.append(r)
        r=rubric();r['criteria'][0]['levels'][0]['points']=True;invalid.append(r)
        r=rubric();r['criteria'][0]['levels'][1]['points']=4;invalid.append(r)
        r=rubric();r['criteria'][1]['id']='argument';invalid.append(r)
        for definition in invalid:
            with self.subTest(definition=definition):self.assertEqual(self.template(definition=definition).status_code,400)
        self.assertFalse(TeachingTemplate.objects.exists())

    def test_template_updates_and_deletion_preserve_activity_snapshot(self):
        self.template();template=TeachingTemplate.objects.get()
        self.assertEqual(self.post('task-edit',self.task_data(rubric=template.definition)).status_code,200)
        changed=rubric();changed['title']='Otra edición';changed['criteria'][0]['title']='Nuevo criterio'
        self.assertEqual(self.post('teaching-template-edit',{'id':template.id,'title':'Otra','kind':'rubric','definition':changed}).status_code,200)
        self.post('teaching-template-delete',{'id':template.id})
        self.t.refresh_from_db();self.assertEqual(self.t.rubric['criteria'][0]['title'],'Argumentación')
        self.assertEqual(self.t.rubric['title'],'Proyecto con evidencia')

    def test_server_calculates_rubric_grade_and_rounds_half_up(self):
        self.attach(r=rubric());s=Submission.objects.create(task=self.t,student=self.users['student'],body='Trabajo')
        response=self.post('grade',{'submission':s.id,'grade':999,'rubric_selections':{'argument':'middle','evidence':'middle'},'criterion_feedback':{'argument':'Ajusta tu argumento'},'feedback':'Buen avance'})
        self.assertEqual(response.status_code,200)
        s.refresh_from_db();self.assertEqual(s.grade,37)
        self.assertEqual(s.rubric_assessment['total'],5);self.assertEqual(s.rubric_assessment['maximum'],10)
        self.assertEqual(s.rubric_assessment['feedback']['argument'],'Ajusta tu argumento')

    def test_rubric_grading_cannot_be_bypassed_or_partial(self):
        self.attach(r=rubric());s=Submission.objects.create(task=self.t,student=self.users['student'],body='Trabajo')
        for values in [{'grade':73},{'rubric_selections':{'argument':'high'}},{'rubric_selections':{'argument':'fake','evidence':'high'}},{'rubric_selections':{'argument':'high','evidence':'high'},'criterion_feedback':{'other':'No'}}]:
            with self.subTest(values=values):self.assertEqual(self.post('grade',{'submission':s.id,**values}).status_code,400)
        s.refresh_from_db();self.assertIsNone(s.grade);self.assertEqual(s.rubric_assessment,{})

    def test_student_sees_own_breakdown_and_not_others(self):
        self.attach(r=rubric())
        s=Submission.objects.create(task=self.t,student=self.users['student'],body='Mi trabajo')
        self.post('grade',{'submission':s.id,'rubric_selections':{'argument':'high','evidence':'high'},'feedback':'Tu evaluación'})
        other=User.objects.create_user('otherstudent');Profile.objects.create(user=other,role='student');self.c.students.add(other)
        Submission.objects.create(task=self.t,student=other,body='Otro trabajo',grade=5)
        self.client.force_login(self.users['student']);data=self.client.get('/api/state').json()
        self.assertEqual(len(data['submissions']),1);self.assertEqual(data['submissions'][0]['rubric_assessment']['grade'],73)
        self.assertEqual(data['tasks'][0]['rubric']['title'],'Proyecto con evidencia')

    def test_conditional_fields_require_only_visible_questions(self):
        self.attach(f=fields());self.client.force_login(self.users['student'])
        data={'task':self.t.id,'answers':{'mode':'Individual','hours':0,'reflection':'Aprendí','members':'Ignorar cuando oculto'}}
        self.assertEqual(self.post('submit',data).status_code,200)
        self.assertNotIn('members',Submission.objects.get().answers)
        data['answers']['mode']='Equipo';data['answers'].pop('members')
        self.assertEqual(self.post('submit',data).status_code,400)
        data['answers']['members']='Ana y Sofía';self.assertEqual(self.post('submit',data).status_code,200)
        self.assertEqual(Submission.objects.get().answers['members'],'Ana y Sofía')

    def test_smart_field_types_limits_and_unknown_answers_are_validated(self):
        self.attach(f=fields());self.client.force_login(self.users['student'])
        valid={'mode':'Individual','hours':2,'reflection':'Aprendí'}
        for change in [{'hours':21},{'hours':'2'},{'hours':True},{'mode':'Otra'},{'reflection':' '},{'extra':'No'},{'hours':float('nan')}]:
            with self.subTest(change=change):self.assertEqual(self.post('submit',{'task':self.t.id,'answers':{**valid,**change}}).status_code,400)
        self.assertFalse(Submission.objects.exists())

    def test_conditional_schema_rejects_cycles_and_invalid_options(self):
        invalid=[]
        f=fields();f[0]['show_if']={'field':'mode','equals':'Equipo'};invalid.append(f)
        f=fields();f[1]['show_if']['equals']='Otra';invalid.append(f)
        f=fields();f[1]['show_if']['field']='hours';invalid.append(f)
        f=fields();f[0]['options']=['Una','Una'];invalid.append(f)
        f=fields();f[2]['min']=30;invalid.append(f)
        for definition in invalid:
            with self.subTest(definition=definition):self.assertEqual(self.template('fields',definition).status_code,400)
        self.assertFalse(TeachingTemplate.objects.exists())

    def test_incomplete_structured_draft_persists_then_submission_replaces_it(self):
        self.attach(f=fields());self.client.force_login(self.users['student'])
        self.assertEqual(self.post('draft',{'task':self.t.id,'body':'','answers':{'mode':'Equipo'}}).status_code,200)
        self.assertFalse(Submission.objects.exists());self.assertEqual(Draft.objects.get().answers,{'mode':'Equipo'})
        self.assertEqual(self.client.get('/api/state').json()['drafts'][0]['answers'],{'mode':'Equipo'})
        self.assertEqual(self.post('submit',{'task':self.t.id,'answers':{'mode':'Equipo','members':'Equipo','hours':2,'reflection':'Aprendí'}}).status_code,200)
        self.assertFalse(Draft.objects.exists())

    def test_rubric_and_fields_lock_after_drafts_or_submissions(self):
        self.attach(r=rubric(),f=fields());Draft.objects.create(task=self.t,student=self.users['student'],answers={'mode':'Individual'})
        self.assertEqual(self.post('task-edit',self.task_data(fields=[])).status_code,400)
        self.assertEqual(self.post('task-edit',self.task_data(rubric={})).status_code,400)
        data=self.client.get('/api/state').json();self.assertTrue(data['tasks'][0]['configuration_locked'])
        self.t.refresh_from_db();self.assertEqual(len(self.t.fields),4)
        Draft.objects.all().delete();Submission.objects.create(task=self.t,student=self.users['student'],body='Respuesta')
        self.assertEqual(self.post('task-edit',self.task_data(rubric={})).status_code,400)
        self.assertEqual(self.post('task-edit',self.task_data(title='Título actualizado')).status_code,200)

    def test_teacher_preferences_are_private_and_keep_appearance(self):
        self.post('appearance',{'accent':'green','density':'compact','reduce_motion':True})
        response=self.post('teaching-preferences',{'points':75,'due_days':14,'submission_mode':'file','kind':'project','color':'blue','allow_late':False,'feedback_bank':['Buen argumento','Añade evidencia']})
        self.assertEqual(response.status_code,200);me=response.json()['me']
        self.assertEqual(me['preferences']['teaching']['points'],75)
        self.assertEqual(me['preferences']['appearance']['accent'],'green')
        self.assertTrue(all('preferences' not in p for p in response.json()['people']))
        self.assertEqual(self.post('teaching-preferences',{'feedback_bank':['No']*11}).status_code,400)

    def test_required_checkbox_and_conditional_false_value(self):
        schema=[{'id':'confirm','label':'Confirmación','type':'checkbox','required':False},{'id':'reason','label':'Motivo','type':'text','required':True,'show_if':{'field':'confirm','equals':False}}]
        self.attach(f=schema);self.client.force_login(self.users['student'])
        self.assertEqual(self.post('submit',{'task':self.t.id,'answers':{'confirm':False}}).status_code,400)
        self.assertEqual(self.post('submit',{'task':self.t.id,'answers':{'confirm':False,'reason':'Mi motivo'}}).status_code,200)
        self.t.fields=[{'id':'confirm','label':'Confirmación','type':'checkbox','required':True}];self.t.save()
        self.assertEqual(self.post('submit',{'task':self.t.id,'answers':{'confirm':False}}).status_code,400)
        self.assertEqual(self.post('submit',{'task':self.t.id,'answers':{'confirm':True}}).status_code,200)
