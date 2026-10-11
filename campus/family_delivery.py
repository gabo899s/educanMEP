"""Optional real transport adapters and a durable, explicit outbox."""
import base64
import json
import urllib.request
import urllib.parse
from datetime import datetime, timedelta, time
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist as UserError
from django.core.mail import EmailMessage, get_connection
from django.db.models import F
from django.utils import timezone
from .models import FamilyDelivery, FamilyPublication, FamilyPushSubscription, GuardianLink, FamilyAppointment, FamilyConversation, FamilyRequest, FamilyReply
from .families import options, links_for, summary_for


def enqueue_publication(p):
    if p.cancelled or p.delivery_prepared or p.publish_at>timezone.now():return
    for guardian in {r.guardian for r in p.receipts.select_related('guardian__profile')}:
        opt=options(guardian)
        if opt['frequency']!='immediate' and not p.urgent:continue
        for channel in opt['channels']:
            if channel=='inapp':continue
            FamilyDelivery.objects.get_or_create(key=f'publication:{p.pk}:guardian:{guardian.pk}:{channel}',defaults={
                'guardian':guardian,'publication':p,'channel':channel,'title':p.title,
                'body':p.body[:6000],'urgent':p.urgent,'due':max(p.publish_at,timezone.now())})

    p.delivery_prepared=True;p.save(update_fields=['delivery_prepared'])


def prepare_digests(now=None):
    now=now or timezone.now();day=timezone.localdate(now)
    for g in {l.guardian for l in GuardianLink.objects.filter(active=True,guardian__is_active=True,guardian__profile__role='guardian').select_related('guardian__profile')}:
        opt=options(g)
        if opt['frequency']=='immediate':continue
        if opt['frequency']=='weekly' and day.weekday()!=0:continue
        key=f'digest:{opt["frequency"]}:{day}:guardian:{g.pk}'
        body=digest_body(g,now)
        for channel in opt['channels']:
            if channel=='inapp':continue
            FamilyDelivery.objects.get_or_create(key=f'{key}:{channel}',defaults={'guardian':g,'channel':channel,
                'title':'Tu resumen de Luma Campus','body':body,'due':now})


def quiet_until(g,now):
    opt=options(g);local=timezone.localtime(now);a=time.fromisoformat(opt['quiet_start']);b=time.fromisoformat(opt['quiet_end']);t=local.time().replace(tzinfo=None)
    quiet=(a<=t<b) if a<b else (t>=a or t<b) if a>b else False
    if not quiet:return None
    day=local.date()+timedelta(days=1 if a>b and t>=a else 0)
    return timezone.make_aware(datetime.combine(day,b))


def transport(d):
    g=d.guardian
    url=getattr(settings,'LUMA_PUBLIC_URL','').rstrip('/')
    title=d.title;content=digest_body(g,timezone.now()) if d.key.startswith('digest:') else d.body
    if d.publication_id:
        translated=d.publication.translations.get(options(g)['language'],{})
        title=translated.get('title',title);content=translated.get('body',content)
    body=content+('\n\nAbrir Luma: '+url if url else '\n\nAbre tu plataforma Luma Campus para responder.')
    if d.channel=='email':
        if not settings.LUMA_SMTP_HOST:raise ValueError('SMTP no configurado.')
        connection=get_connection('django.core.mail.backends.smtp.EmailBackend',host=settings.LUMA_SMTP_HOST,
            port=settings.LUMA_SMTP_PORT,username=settings.LUMA_SMTP_USER,password=settings.LUMA_SMTP_PASSWORD,
            use_tls=settings.LUMA_SMTP_TLS,use_ssl=settings.LUMA_SMTP_SSL,timeout=20)
        if EmailMessage(title,body,settings.LUMA_EMAIL_FROM,[g.email],connection=connection).send(fail_silently=False)!=1:raise ValueError('SMTP no confirmó la aceptación del correo.')
    elif d.channel=='sms':
        account=settings.LUMA_TWILIO_ACCOUNT;token=settings.LUMA_TWILIO_TOKEN;sender=settings.LUMA_TWILIO_FROM
        if not all([account,token,sender]):raise ValueError('Twilio no configurado.')
        import re
        if not re.fullmatch(r'\+[1-9]\d{7,14}',g.profile.phone):raise ValueError('El teléfono necesita formato internacional, por ejemplo +50688888888.')
        data=urllib.parse.urlencode({'To':g.profile.phone,'From':sender,'Body':(title+'\n'+body)[:1500]}).encode()
        request=urllib.request.Request(f'https://api.twilio.com/2010-04-01/Accounts/{urllib.parse.quote(account,safe="")}/Messages.json',data=data,
            headers={'Authorization':'Basic '+base64.b64encode(f'{account}:{token}'.encode()).decode()},method='POST')
        with urllib.request.urlopen(request,timeout=20) as r:
            result=json.loads(r.read(32000))
        if not result.get('sid') or result.get('status') in ['failed','undelivered']:raise ValueError('Twilio no confirmó la aceptación del mensaje.')
    elif d.channel=='push':
        if not settings.LUMA_VAPID_PRIVATE_KEY or not settings.LUMA_VAPID_PUBLIC_KEY:raise ValueError('Web Push no configurado.')
        try:from pywebpush import webpush,WebPushException
        except ImportError:raise ValueError('Instala requirements-notifications.txt para activar Web Push.')
        subscriptions=list(FamilyPushSubscription.objects.filter(guardian=g))
        if not subscriptions:raise ValueError('No hay un navegador suscrito para esta cuenta.')
        successes=0
        for sub in subscriptions:
            try:
                webpush(subscription_info={'endpoint':sub.endpoint,'keys':sub.keys},data=json.dumps({'title':title,'body':'Tienes una novedad del colegio. Abre Luma para consultarla.','url':url or '/'}),
                    vapid_private_key=settings.LUMA_VAPID_PRIVATE_KEY,vapid_claims={'sub':settings.LUMA_VAPID_SUBJECT},timeout=20)
                successes+=1
            except WebPushException as e:
                if e.response is not None and e.response.status_code in [404,410]:sub.delete()
        if not successes:raise ValueError('Ningún navegador aceptó la notificación.')
    else:raise ValueError('Canal no admitido.')


def process(limit=100):
    now=timezone.now()
    for p in FamilyPublication.objects.filter(cancelled=False,delivery_prepared=False,publish_at__lte=now):enqueue_publication(p)
    prepare_digests(now)
    prepare_appointment_reminders(now)
    # A process that died after provider acceptance has an unknown result: never blindly resend it.
    FamilyDelivery.objects.filter(status='sending',claimed_at__lt=now-timedelta(minutes=10)).update(status='unknown',error='Proceso interrumpido; verifica el proveedor antes de reenviar.')
    count=0
    for pk in FamilyDelivery.objects.filter(status__in=['pending','failed'],due__lte=now,attempts__lt=3).order_by('due').values_list('pk',flat=True)[:limit]:
        d=FamilyDelivery.objects.select_related('guardian__profile','publication').get(pk=pk)
        valid=d.guardian.is_active and d.guardian.profile.role=='guardian' and links_for(d.guardian).exists()
        if d.publication_id:
            valid=valid and not d.publication.cancelled and d.publication.receipts.filter(guardian=d.guardian,student_id__in=links_for(d.guardian).values('student_id')).exists()
        valid=valid and notice_valid(d)
        if not valid:FamilyDelivery.objects.filter(pk=pk).update(status='cancelled');continue
        if d.publication_id and not d.urgent and options(d.guardian)['frequency']!='immediate':FamilyDelivery.objects.filter(pk=pk).update(status='cancelled');continue
        if d.channel not in options(d.guardian)['channels']:FamilyDelivery.objects.filter(pk=pk).update(status='cancelled');continue
        quiet=quiet_until(d.guardian,now) if not d.urgent else None
        if quiet:FamilyDelivery.objects.filter(pk=pk).update(due=quiet);continue
        # Compare-and-set claims are portable to SQLite and PostgreSQL.
        if not FamilyDelivery.objects.filter(pk=pk,status__in=['pending','failed'],attempts__lt=3).update(status='sending',claimed_at=now,attempts=F('attempts')+1):continue
        try:
            transport(d)
        except Exception as e:
            # Never persist HTTP bodies, credentials or provider error strings.
            detail=str(e)[:200] if isinstance(e,ValueError) else 'El proveedor no confirmó el envío. Revisa su configuración y registro.'
            FamilyDelivery.objects.filter(pk=pk).update(status='failed',error=detail,due=now+timedelta(minutes=15))
        else:
            FamilyDelivery.objects.filter(pk=pk).update(status='sent',error='',sent_at=timezone.now());count+=1
    return count


def enqueue_notice(g,key,title,body,due=None):
    opt=options(g)
    if opt['frequency']!='immediate' and not key.startswith('appointment:'):return
    for channel in opt['channels']:
        if channel=='inapp':continue
        FamilyDelivery.objects.get_or_create(key=f'{key}:guardian:{g.pk}:{channel}',defaults={'guardian':g,'channel':channel,
            'title':title,'body':body,'due':due or timezone.now()})


def prepare_appointment_reminders(now):
    from .families import appointment_visible
    for a in FamilyAppointment.objects.filter(guardian__isnull=False,cancelled=False,starts__gt=now,starts__lte=now+timedelta(days=1)).select_related('guardian__profile'):
        if not options(a.guardian)['remind_appointments']:continue
        if not a.guardian.is_active or a.guardian.profile.role!='guardian' or not appointment_visible(a.guardian).filter(pk=a.pk).exists():continue
        local=timezone.localtime(a.starts)
        enqueue_notice(a.guardian,f'appointment:{a.pk}','Tu cita con el colegio',
                       f'Tienes una cita el {local:%d/%m/%Y a las %H:%M}. Consulta los detalles en Hogar y colegio → Citas.')


def notice_valid(d):
    from .families import appointment_visible,conversation
    prefix=d.key.split(':',1)[0]
    if prefix not in ['appointment','conversation','request']:return True
    try:identifier=int(d.key.split(':')[1])
    except (ValueError,IndexError):return False
    if prefix=='appointment':return options(d.guardian)['remind_appointments'] and appointment_visible(d.guardian).filter(pk=identifier,guardian=d.guardian,cancelled=False,starts__gt=timezone.now()).exists()
    if prefix=='request':return FamilyRequest.objects.filter(pk=identifier,guardian=d.guardian,student_id__in=links_for(d.guardian).values('student_id')).exists()
    try:conversation(d.guardian,identifier)
    except (PermissionError,UserError):return False
    return True


def digest_body(g,now):
    from .families import appointment_visible,conversation
    text=['Tu resumen escolar','Consulta y responde en Luma Campus.']
    for l in links_for(g).select_related('student'):
        if l.academic:
            s=summary_for(l.student)
            text.append(f'{s["name"]}: {s["absences_week"]} ausencias en 7 días; {len(s["upcoming"])} actividades próximas.')
            text.extend(f'• {t["title"]}: {t["due"]}' for t in s['upcoming'])
    pubs=FamilyPublication.objects.filter(receipts__guardian=g,receipts__student_id__in=links_for(g).values('student_id'),
        cancelled=False,publish_at__lte=now,publish_at__gte=now-timedelta(days=7 if options(g)['frequency']=='weekly' else 1)).distinct()
    text.extend(f'Comunicado: {p.title}' for p in pubs)
    unread=0
    for c in FamilyConversation.objects.filter(guardian=g,student_id__in=links_for(g).values('student_id')):
        try:conversation(g,c.id)
        except (PermissionError,UserError):continue
        unread+=c.replies.exclude(author=g).filter(read_at__isnull=True).count()
    text.append(f'{unread} mensajes familiares sin leer.')
    pending=FamilyRequest.objects.filter(guardian=g,student_id__in=links_for(g).values('student_id'),status='information').count()
    text.append(f'{pending} trámites necesitan información adicional.')
    for a in appointment_visible(g).filter(guardian=g,cancelled=False,starts__gt=now,starts__lte=now+timedelta(days=7)):
        text.append(f'Cita: {timezone.localtime(a.starts):%d/%m/%Y %H:%M}.')
    text.append('También revisa tus permisos y trámites pendientes en la plataforma.')
    return '\n'.join(text)[:12000]
