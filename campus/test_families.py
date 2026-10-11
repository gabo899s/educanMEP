import json
import tempfile
from datetime import timedelta
from unittest.mock import patch
from django.test import TestCase,override_settings
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from .models import (Profile,Course,Task,Submission,Attendance,GuardianLink,FamilyPublication,FamilyReceipt,
    FamilyConversation,FamilyReply,AbsenceJustification,FamilyAppointment,FamilyRequest,FamilySupportPlan,
    FamilyDelivery,StudentNote,AIStudySession,FamilyCommunicationDraft,Institution,TutoringSlot)
from .families import state,summary_for,options
from .family_delivery import process,quiet_until,prepare_digests

class FamilyTests(TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.ov=override_settings(MEDIA_ROOT=self.tmp.name);self.ov.enable();self.addCleanup(self.ov.disable)
        self.us={}
        for name,role in [('admin','admin'),('admin2','admin'),('teacher','teacher'),('teacher2','teacher'),('student','student'),('student2','student'),('student3','student'),('guardian','guardian'),('guardian2','guardian'),('guardian3','guardian')]:
            u=User.objects.create_user(name,email=name+'@school.test',password='PasswordSafe123!',first_name=name)
            Profile.objects.create(user=u,role=role);self.us[name]=u
        self.c=Course.objects.create(title='Ciencias',code='SCI',teacher=self.us['teacher']);self.c.students.add(self.us['student'],self.us['student2'])
        self.other=Course.objects.create(title='Arte',code='ART',teacher=self.us['teacher2']);self.other.students.add(self.us['student3'])
        self.link=GuardianLink.objects.create(guardian=self.us['guardian'],student=self.us['student'],verified_by=self.us['admin'])
        GuardianLink.objects.create(guardian=self.us['guardian2'],student=self.us['student2'],verified_by=self.us['admin'])
        self.now=timezone.now()
        self.task=Task.objects.create(course=self.c,title='Explorar',description='Privado borrador',due=timezone.localdate()+timedelta(days=2),points=100)
        self.att=Attendance.objects.create(course=self.c,student=self.us['student'],date=timezone.localdate(),present=False)
    def post(self,who,path,data):
        self.client.force_login(self.us[who]);return self.client.post('/api/'+path,json.dumps(data),content_type='application/json')
    def publish(self,**extra):
        data={'course':self.c.id,'title':'Excursión','body':'Aprendemos juntos','kind':'permission','students':[],**extra}
        r=self.post('teacher','family-publish',data);self.assertEqual(r.status_code,200,r.content)
        return FamilyPublication.objects.latest('id')
    def receipt(self,p,guardian='guardian'):
        return FamilyReceipt.objects.get(publication=p,guardian=self.us[guardian])
    def test_only_admin_can_link_and_revoke(self):
        data={'guardian':self.us['guardian3'].id,'student':self.us['student3'].id,'relationship':'Madre','academic':True}
        for who in ['teacher','guardian','student']:self.assertEqual(self.post(who,'family-link',data).status_code,403)
        self.assertEqual(self.post('admin','family-link',data).status_code,200)
        l=GuardianLink.objects.get(guardian=self.us['guardian3']);self.assertEqual(l.verified_by,self.us['admin'])
        self.assertEqual(self.post('admin','family-unlink',{'id':l.id}).status_code,200)
        self.assertFalse(GuardianLink.objects.get(pk=l.id).active)
    def test_guardian_is_real_role_and_has_no_academic_mutations(self):
        self.assertEqual(self.post('admin','user',{'name':'Encargado real','email':'real@school.test','password':'SecurePassword22','role':'guardian'}).status_code,200)
        for action in ['course','task','grade','attendance','membership','user','institution','family-publish','family-support','family-appointment']:
            self.assertEqual(self.post('guardian',action,{}).status_code,403,action)
    def test_guardian_state_never_contains_private_student_content(self):
        StudentNote.objects.create(student=self.us['student'],title='SECRETO',body='PRIVADO')
        AIStudySession.objects.create(student=self.us['student'],title='CHAT PRIVADO')
        Submission.objects.create(task=self.task,student=self.us['student'],body='ENTREGA PRIVADA',grade=80,feedback='Buen avance')
        self.client.force_login(self.us['guardian']);r=self.client.get('/api/state');self.assertEqual(r.status_code,200)
        self.assertNotIn('PRIVADO',r.content.decode());self.assertNotIn('ENTREGA PRIVADA',r.content.decode())
        data=r.json();self.assertEqual(data['tasks'],[]);self.assertEqual(data['submissions'],[])
        self.assertEqual(data['families']['academic'][str(self.us['student'].id)]['tasks'][0]['grade'],80)
        self.assertNotIn(str(self.us['student2'].id),data['families']['academic'])
    def test_no_academic_permission_still_allows_communication(self):
        self.link.academic=False;self.link.save();self.assertEqual(state(self.us['guardian'])['academic'],{})
        FamilySupportPlan.objects.create(author=self.us['teacher'],student=self.us['student'],course=self.c,title='Privado académico',evidence='Resultados académicos',agreement='Revisar',follow_up=timezone.localdate(),shared=True)
        self.assertEqual(state(self.us['guardian'])['plans'],[])
        self.assertEqual(self.post('guardian','family-conversation',{'student':self.us['student'].id,'staff':self.us['teacher'].id,'subject':'Consulta','body':'Hola'}).status_code,200)
    def test_scheduled_and_draft_tasks_hidden(self):
        self.task.publication='draft';self.task.save()
        Task.objects.create(course=self.c,title='Futuro',description='Oculto',due=timezone.localdate()+timedelta(days=10),publication='scheduled',publish_at=self.now+timedelta(days=3))
        self.assertEqual(state(self.us['guardian'])['academic'][str(self.us['student'].id)]['tasks'],[])
    def test_teacher_publication_scope(self):
        self.assertEqual(self.post('teacher2','family-publish',{'course':self.c.id,'title':'No','body':'No'}).status_code,403)
        self.assertEqual(self.post('teacher','family-publish',{'title':'No','body':'No','students':[self.us['student'].id]}).status_code,403)
        self.assertEqual(self.post('teacher','family-publish',{'course':self.c.id,'title':'No','body':'No','students':[self.us['student3'].id]}).status_code,403)
    def test_publication_recipient_snapshot_and_scheduled_visibility(self):
        p=self.publish(publish_at=(self.now+timedelta(days=1)).isoformat())
        self.assertEqual(p.receipts.count(),2);self.assertEqual(state(self.us['guardian'])['publications'],[])
        self.assertEqual(len(state(self.us['teacher'])['publications']),1)
        self.assertEqual(self.post('guardian','family-read',{'id':self.receipt(p).id}).status_code,404)
    def test_permission_response_signature_deadline_and_duplicates(self):
        p=self.publish(deadline=(self.now+timedelta(days=1)).isoformat());r=self.receipt(p)
        data={'id':r.id,'response':'accepted','signature':'Madre','consent':True,'answers':{}}
        self.assertEqual(self.post('guardian2','family-respond',data).status_code,404)
        self.assertEqual(self.post('guardian','family-respond',{**data,'consent':False}).status_code,400)
        self.assertEqual(self.post('guardian','family-respond',data).status_code,200)
        r.refresh_from_db();self.assertIsNotNone(r.read_at);self.assertIsNotNone(r.confirmed_at)
        self.assertEqual(self.post('guardian','family-respond',data).status_code,400)
        p.deadline=self.now-timedelta(seconds=1);p.save();self.assertEqual(self.post('guardian2','family-respond',{**data,'id':self.receipt(p,'guardian2').id}).status_code,400)
    def test_smart_form_required_conditional_fields(self):
        fields=[{'id':'bus','label':'Transporte','type':'choice','required':True,'options':['Sí','No']},
                {'id':'stop','label':'Parada','type':'text','required':True,'show_if':{'field':'bus','equals':'Sí'}}]
        p=self.publish(fields=fields);r=self.receipt(p);data={'id':r.id,'response':'accepted','signature':'Madre','consent':True}
        self.assertEqual(self.post('guardian','family-respond',{**data,'answers':{'bus':'Sí'}}).status_code,400)
        self.assertEqual(self.post('guardian','family-respond',{**data,'answers':{'bus':'No'}}).status_code,200)
        self.assertEqual(FamilyReceipt.objects.get(pk=r.pk).answers,{'bus':'No'})
    def test_event_capacity_is_per_child_with_waitlist(self):
        p=self.publish(kind='event',event_at=(self.now+timedelta(days=2)).isoformat(),capacity=1,acknowledgement=False)
        for who,expected in [('guardian','attending'),('guardian2','waitlist')]:
            self.assertEqual(self.post(who,'family-respond',{'id':self.receipt(p,who).id,'response':'attending'}).status_code,200)
            self.assertEqual(self.receipt(p,who).response,expected)
    def test_revocation_blocks_publications_conversation_and_files(self):
        p=self.publish();c=FamilyConversation.objects.create(guardian=self.us['guardian'],student=self.us['student'],staff=self.us['teacher'],subject='Asunto')
        self.link.active=False;self.link.save()
        self.assertEqual(state(self.us['guardian'])['publications'],[]);self.assertEqual(state(self.us['guardian'])['conversations'],[])
        self.assertEqual(self.post('guardian','family-reply',{'id':c.id,'body':'Hola'}).status_code,404)
        self.client.force_login(self.us['guardian']);self.assertEqual(self.client.get(f'/api/family-file/publication/{p.id}').status_code,403)
    def test_conversation_scope_and_privacy_even_other_admin(self):
        data={'student':self.us['student'].id,'staff':self.us['teacher'].id,'subject':'Consulta','body':'¿Podemos conversar?'}
        self.assertEqual(self.post('guardian','family-conversation',data).status_code,200);c=FamilyConversation.objects.get()
        for who in ['guardian2','teacher2','admin2']:self.assertEqual(self.post(who,'family-reply',{'id':c.id,'body':'Intento'}).status_code,403)
        self.assertEqual(self.post('guardian','family-conversation',{**data,'staff':self.us['teacher2'].id}).status_code,403)
        self.assertEqual(self.post('teacher','family-reply',{'id':c.id,'body':'Claro'}).status_code,200)
        self.assertEqual(self.post('guardian','family-read-conversation',{'id':c.id}).status_code,200)
        self.assertIsNotNone(c.replies.get(author=self.us['teacher']).read_at)
    def test_closed_conversation_must_reopen(self):
        c=FamilyConversation.objects.create(guardian=self.us['guardian'],student=self.us['student'],staff=self.us['teacher'],subject='Asunto',closed=True)
        self.assertEqual(self.post('guardian','family-reply',{'id':c.id,'body':'Hola'}).status_code,400)
        self.assertEqual(self.post('guardian','family-close-conversation',{'id':c.id,'closed':False}).status_code,200)
        self.assertEqual(self.post('guardian','family-reply',{'id':c.id,'body':'Hola'}).status_code,200)
    def test_justification_review_and_request_more_information(self):
        data={'attendance':self.att.id,'reason':'Consulta médica','kind':'absence'}
        self.assertEqual(self.post('guardian','family-justify',data).status_code,200);j=AbsenceJustification.objects.get()
        self.assertEqual(self.post('guardian2','family-justify',data).status_code,404)
        self.assertEqual(self.post('teacher2','family-review-absence',{'id':j.id,'status':'accepted','review':'Ok'}).status_code,403)
        self.assertEqual(self.post('teacher','family-review-absence',{'id':j.id,'status':'information','review':'Adjunta comprobante'}).status_code,200)
        self.assertEqual(self.post('guardian','family-justify',{**data,'reason':'Ampliado'}).status_code,200)
        self.assertEqual(self.post('teacher','family-review-absence',{'id':j.id,'status':'accepted','review':'Justificada'}).status_code,200)
        self.att.refresh_from_db();self.assertFalse(self.att.present)
    def test_late_justification_for_present_record(self):
        self.att.present=True;self.att.save()
        self.assertEqual(self.post('guardian','family-justify',{'attendance':self.att.id,'kind':'absence','reason':'No'}).status_code,400)
        self.assertEqual(self.post('guardian','family-justify',{'attendance':self.att.id,'kind':'late','reason':'Llegó tarde'}).status_code,200)
    def test_appointments_scope_overlap_and_double_booking(self):
        data={'course':self.c.id,'starts':(self.now+timedelta(days=1)).isoformat(),'minutes':30,'location':'Sala 1'}
        self.assertEqual(self.post('teacher','family-appointment',data).status_code,200);a=FamilyAppointment.objects.get()
        self.assertEqual(self.post('teacher','family-appointment',data).status_code,400)
        self.assertEqual(self.post('guardian','family-book',{'id':a.id,'student':self.us['student2'].id}).status_code,404)
        self.assertEqual(self.post('guardian','family-book',{'id':a.id,'student':self.us['student'].id,'question':'Progreso'}).status_code,200)
        self.assertEqual(self.post('guardian2','family-book',{'id':a.id,'student':self.us['student2'].id}).status_code,404)
        self.assertEqual(self.post('teacher','family-agreement',{'id':a.id,'agreement':'Revisar en una semana'}).status_code,200)
        self.assertEqual(self.post('guardian','family-release',{'id':a.id}).status_code,200)
        a.refresh_from_db();self.assertIsNone(a.guardian);self.assertEqual(a.agreement,'')
    def test_family_appointment_conflicts_with_existing_student_tutoring(self):
        TutoringSlot.objects.create(teacher=self.us['teacher'],course=self.c,starts=self.now+timedelta(days=1),minutes=30,location='Aula')
        self.assertEqual(self.post('teacher','family-appointment',{'course':self.c.id,'starts':(self.now+timedelta(days=1)).isoformat(),'minutes':30,'location':'Sala'}).status_code,400)
    def test_requests_admin_workflow_and_family_more_information(self):
        self.assertEqual(self.post('guardian','family-request',{'student':self.us['student'].id,'title':'Constancia','body':'Para beca','kind':'certificate'}).status_code,200)
        r=FamilyRequest.objects.get();self.assertEqual(self.post('teacher','family-request-update',{'id':r.id,'body':'No'}).status_code,403)
        self.assertEqual(self.post('guardian2','family-request-update',{'id':r.id,'body':'No'}).status_code,403)
        self.assertEqual(self.post('guardian','family-request-update',{'id':r.id,'body':'Más'}).status_code,403)
        self.assertEqual(self.post('admin','family-request-update',{'id':r.id,'status':'information','body':'Documento faltante'}).status_code,200)
        self.assertEqual(self.post('guardian','family-request-update',{'id':r.id,'body':'Adjunto datos','status':'resolved'}).status_code,200)
        r.refresh_from_db();self.assertEqual(r.status,'received');self.assertEqual(r.history.count(),3)
        self.assertEqual(self.post('admin','family-request-update',{'id':r.id,'status':'resolved','body':'Constancia lista'}).status_code,200)
    def test_support_plan_is_private_until_explicitly_shared(self):
        data={'student':self.us['student'].id,'course':self.c.id,'title':'Apoyo','evidence':'Tres ausencias','agreement':'Reunión','follow_up':str(timezone.localdate()+timedelta(days=7))}
        self.assertEqual(self.post('teacher','family-support',data).status_code,200);p=FamilySupportPlan.objects.get()
        self.assertEqual(state(self.us['guardian'])['plans'],[])
        self.assertEqual(self.post('teacher','family-support',{**data,'id':p.id,'shared':True}).status_code,200)
        self.assertEqual(len(state(self.us['guardian'])['plans']),1);self.assertEqual(state(self.us['guardian2'])['plans'],[])
    def test_settings_validation_and_no_provider_keys_in_state(self):
        data={'channels':['email','sms'],'frequency':'daily','language':'en','quiet_start':'20:00','quiet_end':'07:00','absence_threshold':4,'missing_threshold':2}
        self.assertEqual(self.post('guardian','family-settings',data).status_code,200)
        self.assertEqual(options(User.objects.get(pk=self.us['guardian'].pk))['frequency'],'daily')
        self.assertEqual(self.post('guardian','family-settings',{**data,'channels':['bad']}).status_code,400)
        with override_settings(LUMA_SMTP_PASSWORD='SERVER_SECRET'):
            self.client.force_login(self.us['guardian']);self.assertNotIn('SERVER_SECRET',self.client.get('/api/state').content.decode())
    def test_push_rejects_non_provider_and_private_endpoints(self):
        for url in ['http://127.0.0.1','https://example.com','https://fcm.googleapis.com@127.0.0.1','https://fcm.googleapis.com:444/path']:
            self.assertEqual(self.post('guardian','family-push',{'endpoint':url,'keys':{'auth':'x','p256dh':'y'}}).status_code,400)
    def test_ai_drafts_are_private_never_auto_publish(self):
        with patch('campus.ai_provider.completion',return_value='Borrador para revisar'):
            r=self.post('teacher','family-ai/generate',{'title':'Comunicado','prompt':'Reunión de familias','mode':'draft'})
        self.assertEqual(r.status_code,200,r.content);self.assertEqual(FamilyPublication.objects.count(),0)
        self.assertEqual(state(self.us['teacher2'])['drafts'],[])
        self.assertEqual(self.post('guardian','family-ai/generate',{'title':'No'}).status_code,403)
    def test_ai_summary_does_not_access_another_conversation(self):
        c=FamilyConversation.objects.create(guardian=self.us['guardian'],student=self.us['student'],staff=self.us['teacher'],subject='Privado')
        with patch('campus.ai_provider.completion') as provider:
            self.assertEqual(self.post('admin','family-ai/generate',{'title':'Resumen','mode':'summary','conversation':c.id}).status_code,403)
            provider.assert_not_called()
    def test_module_disabled_blocks_mutation(self):
        Institution.objects.create(modules={'families':{'enabled':False,'label':'Familias'}})
        self.assertEqual(self.post('guardian','family-conversation',{'student':self.us['student'].id,'staff':self.us['teacher'].id,'subject':'Hola','body':'Hola'}).status_code,403)
    def test_multipart_publication_file_and_private_download(self):
        self.client.force_login(self.us['teacher']);r=self.client.post('/api/family-publish',{'course':self.c.id,'kind':'announcement','title':'Circular','body':'Hola','fields':'[]','students':'[]','acknowledgement':'true','urgent':'false','file':SimpleUploadedFile('circular.txt',b'Archivo privado')})
        self.assertEqual(r.status_code,200,r.content);p=FamilyPublication.objects.get()
        self.client.force_login(self.us['guardian']);r=self.client.get(f'/api/family-file/publication/{p.id}');self.assertEqual(r.status_code,200);r.close()
        self.client.force_login(self.us['guardian2']);r=self.client.get(f'/api/family-file/publication/{p.id}');self.assertEqual(r.status_code,200);r.close()
        self.client.force_login(self.us['guardian3']);self.assertEqual(self.client.get(f'/api/family-file/publication/{p.id}').status_code,403)
    def test_deactivated_or_changed_guardian_loses_scope(self):
        self.us['guardian'].profile.role='student';self.us['guardian'].profile.save()
        self.assertEqual(state(self.us['admin'])['links'],[l for l in state(self.us['admin'])['links'] if l['guardian']!=self.us['guardian'].id])
    def test_real_alerts_and_weekly_summary(self):
        for i in range(3):Task.objects.create(course=self.c,title=f'Pendiente {i}',description='Trabajo',due=timezone.localdate()-timedelta(days=1))
        alerts=state(self.us['teacher'])['alerts'];self.assertTrue(any(a['student']==self.us['student'].id and a['missing']==3 for a in alerts))
        summary=summary_for(self.us['student']);self.assertEqual(summary['absences_week'],1);self.assertEqual(len(summary['upcoming']),1)
    def test_delivery_is_deduplicated_and_only_sent_after_provider_success(self):
        p=self.us['guardian'].profile;p.preferences={'family':{'channels':['inapp','email'],'quiet_start':'00:00','quiet_end':'00:00'}};p.save()
        pub=self.publish(urgent=True)
        with patch('campus.family_delivery.transport') as send:
            self.assertEqual(process(),1);self.assertEqual(process(),0);self.assertEqual(send.call_count,1)
        self.assertEqual(FamilyDelivery.objects.get().status,'sent')
    def test_delivery_failure_and_revocation_cancel(self):
        p=self.us['guardian'].profile;p.preferences={'family':{'channels':['email']}};p.save();self.publish(urgent=True)
        with patch('campus.family_delivery.transport',side_effect=ValueError('SMTP no configurado.')):self.assertEqual(process(),0)
        d=FamilyDelivery.objects.get();self.assertEqual(d.status,'failed');self.assertIsNone(d.sent_at)
        self.link.active=False;self.link.save();d.due=self.now-timedelta(seconds=1);d.save();process();d.refresh_from_db();self.assertEqual(d.status,'cancelled')
    def test_quiet_hours_and_urgent_exception(self):
        local=timezone.make_aware(timezone.datetime(2026,10,11,22,0));self.assertIsNotNone(quiet_until(self.us['guardian'],local))
        self.assertIsNone(quiet_until(self.us['guardian'],timezone.make_aware(timezone.datetime(2026,10,11,10,0))))
    def test_daily_digest_deduplicated_and_excludes_private_notes(self):
        p=self.us['guardian'].profile;p.preferences={'family':{'channels':['email'],'frequency':'daily'}};p.save()
        StudentNote.objects.create(student=self.us['student'],title='Secret',body='Never share this')
        prepare_digests();prepare_digests();self.assertEqual(FamilyDelivery.objects.count(),1);self.assertNotIn('Never share',FamilyDelivery.objects.get().body)
    def test_stale_delivery_not_resent_automatically(self):
        d=FamilyDelivery.objects.create(guardian=self.us['guardian'],key='stale',channel='email',title='Aviso',body='Hola',due=self.now,status='sending',claimed_at=self.now-timedelta(minutes=20))
        with patch('campus.family_delivery.transport') as send:process();send.assert_not_called()
        d.refresh_from_db();self.assertEqual(d.status,'unknown')
    def test_enrollment_request_results_in_real_membership(self):
        self.assertEqual(self.post('guardian','family-request',{'student':self.us['student'].id,'kind':'enrollment','title':'Matrícula','body':'Agregar Arte'}).status_code,200)
        r=FamilyRequest.objects.get()
        self.assertEqual(self.post('guardian','family-enroll',{'id':r.id,'courses':[self.other.id]}).status_code,403)
        self.assertEqual(self.post('admin','family-enroll',{'id':r.id,'courses':[self.other.id]}).status_code,200)
        self.assertTrue(self.other.students.filter(pk=self.us['student'].id).exists());r.refresh_from_db();self.assertEqual(r.status,'resolved')
        self.assertIn('Arte',r.history.latest('id').body)
    def test_translation_is_reviewed_and_respects_preferred_language(self):
        p=self.publish();payload={'id':p.id,'language':'en','title':'Field trip','body':'We will study plants.','reviewed':True}
        self.assertEqual(self.post('teacher','family-translation',{**payload,'reviewed':False}).status_code,400)
        self.assertEqual(self.post('teacher2','family-translation',payload).status_code,404)
        self.assertEqual(self.post('teacher','family-translation',payload).status_code,200)
        profile=self.us['guardian'].profile;profile.preferences={'family':{'language':'en'}};profile.save()
        g=User.objects.select_related('profile').get(pk=self.us['guardian'].pk)
        publication=state(g)['publications'][0];self.assertEqual(publication['title'],'Field trip');self.assertEqual(publication['original_title'],'Excursión')
    def test_translated_ai_draft_retains_source_and_never_publishes(self):
        p=self.publish()
        with patch('campus.ai_provider.completion',return_value='Reviewed translation needed'):
            r=self.post('teacher','family-ai/generate',{'title':'Traducción','mode':'translate','publication':p.id,'language':'en'})
        self.assertEqual(r.status_code,200);draft=FamilyCommunicationDraft.objects.get();self.assertEqual(draft.publication_id,p.id)
        p.refresh_from_db();self.assertEqual(p.translations,{})
    def test_tutoring_cannot_overlap_family_appointment(self):
        FamilyAppointment.objects.create(staff=self.us['teacher'],course=self.c,starts=self.now+timedelta(days=1),minutes=30,location='Sala')
        self.assertEqual(self.post('teacher','tutoring-save',{'course':self.c.id,'starts':(self.now+timedelta(days=1)).isoformat(),'minutes':30,'location':'Sala'}).status_code,400)
    def test_email_adapter_requires_provider_acceptance(self):
        from .family_delivery import transport
        d=FamilyDelivery.objects.create(guardian=self.us['guardian'],key='mail',channel='email',title='Aviso',body='Hola',due=self.now)
        with override_settings(LUMA_SMTP_HOST='smtp.example.com',LUMA_EMAIL_FROM='school@example.com'),patch('campus.family_delivery.get_connection'),patch('campus.family_delivery.EmailMessage') as email:
            email.return_value.send.return_value=1;transport(d);self.assertEqual(email.call_args.args[3],[self.us['guardian'].email])
            email.return_value.send.return_value=0
            with self.assertRaises(ValueError):transport(d)
    def test_sms_adapter_validates_phone_and_response(self):
        from .family_delivery import transport
        d=FamilyDelivery.objects.create(guardian=self.us['guardian'],key='sms',channel='sms',title='Aviso',body='Hola',due=self.now)
        with override_settings(LUMA_TWILIO_ACCOUNT='AC0123',LUMA_TWILIO_TOKEN='secret',LUMA_TWILIO_FROM='+15555555555'):
            with self.assertRaises(ValueError):transport(d)
            self.us['guardian'].profile.phone='+50688888888';self.us['guardian'].profile.save()
            with patch('campus.family_delivery.urllib.request.urlopen') as send:
                send.return_value.__enter__.return_value.read.return_value=b'{"sid":"SM123","status":"queued"}';transport(d)
                self.assertNotIn('secret',send.call_args.args[0].full_url)
    def test_guardian_direct_urls_cannot_read_student_private_files_or_ai(self):
        sub=Submission.objects.create(task=self.task,student=self.us['student'],body='Secreto')
        self.client.force_login(self.us['guardian'])
        self.assertEqual(self.client.get(f'/api/file/{sub.id}').status_code,403)
        self.assertEqual(self.client.get('/api/notes-export').status_code,403)
        self.assertEqual(self.client.get('/api/ai/state').status_code,403)
    def test_justified_attendance_cannot_be_overwritten(self):
        AbsenceJustification.objects.create(attendance=self.att,guardian=self.us['guardian'],reason='Consulta médica',status='accepted')
        r=self.post('teacher','attendance',{'course':self.c.id,'date':str(self.att.date),'rows':[{'student':self.us['student'].id,'present':True}]})
        self.assertEqual(r.status_code,400);self.att.refresh_from_db();self.assertFalse(self.att.present)
    def test_retry_requires_provider_verification_and_staff_scope(self):
        p=self.publish();d=FamilyDelivery.objects.create(guardian=self.us['guardian'],publication=p,key='retry',channel='email',title='Aviso',body='Hola',due=self.now,status='failed',attempts=3)
        self.assertEqual(self.post('teacher','family-retry-delivery',{'id':d.id,'verified':False}).status_code,400)
        self.assertEqual(self.post('teacher2','family-retry-delivery',{'id':d.id,'verified':True}).status_code,403)
        self.assertEqual(self.post('teacher','family-retry-delivery',{'id':d.id,'verified':True}).status_code,200)
        d.refresh_from_db();self.assertEqual(d.status,'pending');self.assertEqual(d.attempts,0)
    def test_preferences_do_not_replay_past_publications(self):
        p=self.publish();self.assertTrue(p.delivery_prepared)
        profile=self.us['guardian'].profile;profile.preferences={'family':{'channels':['email']}};profile.save()
        with patch('campus.family_delivery.transport') as send:process();send.assert_not_called()
        self.assertEqual(FamilyDelivery.objects.count(),0)
    def test_guardians_use_family_conversations_not_invisible_legacy_messages(self):
        self.assertEqual(self.post('teacher','message',{'recipient':self.us['guardian'].id,'body':'Hola'}).status_code,403)
    def test_family_academic_queries_do_not_grow_per_task(self):
        from django.test.utils import CaptureQueriesContext
        from django.db import connection
        from .families import academic_data
        with CaptureQueriesContext(connection) as first:academic_data(self.us['student'])
        Task.objects.bulk_create([Task(course=self.c,title=f'Tarea {i}',description='Práctica',due=timezone.localdate()) for i in range(25)])
        with CaptureQueriesContext(connection) as second:academic_data(self.us['student'])
        self.assertEqual(len(first),len(second))
    def test_database_contention_preserves_form_with_actionable_response(self):
        from django.db import OperationalError
        with patch('campus.views.mutate',side_effect=OperationalError('database is locked')):
            r=self.post('teacher','family-publish',{})
        self.assertEqual(r.status_code,409);self.assertIn('formulario se conserva',r.json()['error'])
