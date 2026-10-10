import json
from datetime import date
from pathlib import Path
from django.http import JsonResponse,FileResponse,HttpResponse
from django.contrib.auth import authenticate,login,logout
from django.contrib.auth.models import User
from django.db.models import Q
from django.db import IntegrityError,transaction
from django.views.decorators.csrf import ensure_csrf_cookie
from django.core.exceptions import ValidationError
from django.core.validators import validate_email,URLValidator
from .models import Profile,Course,Post,Task,Submission,Message,Event,Resource,Attendance
from .settings import BASE_DIR

def person(u):
    p=u.profile
    return {'id':u.id,'name':u.get_full_name() or u.username,'email':u.email,'role':p.role,'bio':p.bio,'phone':p.phone,'color':p.color}
def courses(u):
    r=u.profile.role
    return Course.objects.all() if r=='admin' else Course.objects.filter(teacher=u) if r=='teacher' else u.courses.all()
def getcourse(u,id):
    try:return courses(u).get(id=id)
    except Course.DoesNotExist:raise PermissionError('No tienes acceso a esta aula.')
def staff(u,c=None):
    if u.profile.role=='admin' or (u.profile.role=='teacher' and (c is None or c.teacher_id==u.id)):return
    raise PermissionError('Esta acción requiere un profesor o administrador.')
def text(d,k,limit=200):
    v=str(d.get(k,'')).strip()
    if not v or len(v)>limit:raise ValueError(f'{k}: completa el campo (máximo {limit} caracteres).')
    return v
def integer(v,low=0,high=100):
    v=int(v)
    if not low<=v<=high:raise ValueError(f'El valor debe estar entre {low} y {high}.')
    return v

def state(u):
    cs=list(courses(u)); ids=[c.id for c in cs]
    tasks=Task.objects.filter(course_id__in=ids).order_by('due')
    ss=Submission.objects.filter(task__course_id__in=ids)
    if u.profile.role=='student':ss=ss.filter(student=u)
    attendance=Attendance.objects.filter(course_id__in=ids)
    if u.profile.role=='student':attendance=attendance.filter(student=u)
    people=User.objects.filter(is_active=True).select_related('profile')
    return {'me':person(u),'people':[person(p) for p in people],
      'courses':[{'id':c.id,'title':c.title,'code':c.code,'summary':c.summary,'teacher':c.teacher_id,'students':list(c.students.values_list('id',flat=True)),'color':c.color,'symbol':c.symbol,'schedule':c.schedule,'room':c.room} for c in cs],
      'tasks':[{'id':t.id,'course':t.course_id,'title':t.title,'description':t.description,'due':str(t.due),'points':t.points} for t in tasks],
      'submissions':[{'id':s.id,'task':s.task_id,'student':s.student_id,'body':s.body,'file':s.original_name,'grade':s.grade,'feedback':s.feedback,'created':s.created.isoformat()} for s in ss],
      'posts':[{'id':p.id,'course':p.course_id,'author':p.author_id,'body':p.body,'created':p.created.isoformat()} for p in Post.objects.filter(course_id__in=ids).order_by('-created')],
      'messages':[{'id':m.id,'sender':m.sender_id,'recipient':m.recipient_id,'body':m.body,'created':m.created.isoformat(),'read':m.read} for m in Message.objects.filter(Q(sender=u)|Q(recipient=u)).order_by('created')],
      'events':list(Event.objects.order_by('date').values('id','title','date','time','kind','description')),
      'resources':list(Resource.objects.filter(course_id__in=ids).values('id','course_id','title','url','body')),
      'attendance':list(attendance.values('id','course_id','student_id','date','present'))}

@ensure_csrf_cookie
def index(request):
    return FileResponse(open(BASE_DIR/'public'/'index.html','rb'),content_type='text/html')
def asset(request,name):
    if name not in ['app.js','style.css','manrope.ttf','dmsans.ttf']:return HttpResponse(status=404)
    return FileResponse(open(BASE_DIR/'public'/name,'rb'),content_type='font/ttf' if name.endswith('.ttf') else 'text/javascript' if name.endswith('.js') else 'text/css')

def api(request,path):
    try:
        if request.method not in ['GET','POST']:return JsonResponse({'error':'Método no permitido.'},status=405)
        d=json.loads(request.body or '{}') if request.content_type=='application/json' else request.POST
        if path=='login' and request.method=='POST':
            identifier=str(d.get('email','')).strip().lower()
            account=User.objects.filter(email__iexact=identifier,is_active=True).first()
            u=authenticate(request,username=account.username if account else identifier,password=d.get('password',''))
            if not u:return JsonResponse({'error':'Correo o contraseña incorrectos.'},status=401)
            login(request,u)
            return JsonResponse(state(u))
        if not request.user.is_authenticated:return JsonResponse({'error':'Inicia sesión para continuar.'},status=401)
        u=request.user
        if path=='state' and request.method=='GET':return JsonResponse(state(u))
        if path.startswith('file/') and request.method=='GET':
            s=Submission.objects.get(id=int(path.split('/')[1])); c=getcourse(u,s.task.course_id)
            if s.student_id!=u.id:staff(u,c)
            if not s.file:return HttpResponse(status=404)
            return FileResponse(s.file.open('rb'),as_attachment=True,filename=s.original_name)
        if request.method!='POST':return JsonResponse({'error':'Método no permitido.'},status=405)
        if path=='logout':
            logout(request);return JsonResponse({'ok':True})
        if path=='profile':
            name=text(d,'name',100).split(' ',1);u.first_name=name[0];u.last_name=name[1] if len(name)>1 else '';u.save()
            p=u.profile;p.bio=str(d.get('bio',''))[:1000];p.phone=str(d.get('phone',''))[:40];p.save()
        elif path=='password':
            if not u.check_password(d.get('current','')):raise ValueError('La contraseña actual no es correcta.')
            pw=text(d,'password',100)
            if len(pw)<10:raise ValueError('Usa al menos 10 caracteres.')
            u.set_password(pw);u.save()
            from django.contrib.auth import update_session_auth_hash
            update_session_auth_hash(request,u)
        elif path=='message':
            to=User.objects.get(id=int(d['recipient']),is_active=True)
            if to.id==u.id:raise ValueError('Elige otro destinatario.')
            Message.objects.create(sender=u,recipient=to,body=text(d,'body',4000))
        elif path=='read':Message.objects.filter(sender_id=int(d['sender']),recipient=u).update(read=True)
        elif path=='post':
            c=getcourse(u,int(d['course']));Post.objects.create(course=c,author=u,body=text(d,'body',4000))
        elif path=='task':
            c=getcourse(u,int(d['course']));staff(u,c)
            Task.objects.create(course=c,title=text(d,'title'),description=text(d,'description',5000),due=date.fromisoformat(d['due']),points=integer(d.get('points',100),1,1000))
        elif path=='submit':
            t=Task.objects.get(id=int(d['task']));getcourse(u,t.course_id)
            if u.profile.role!='student':raise PermissionError('Las entregas corresponden a estudiantes.')
            body=str(d.get('body','')).strip();f=request.FILES.get('file')
            if not body and not f:raise ValueError('Escribe tu respuesta o adjunta un archivo.')
            if len(body)>10000:raise ValueError('La respuesta es demasiado larga.')
            if f and f.size>5*1024*1024:raise ValueError('El archivo no puede superar 5 MB.')
            s,_=Submission.objects.get_or_create(task=t,student=u)
            if s.grade is not None:raise ValueError('La entrega ya fue calificada.')
            s.body=body
            if f:s.file=f;s.original_name=Path(f.name).name
            s.save()
        elif path=='grade':
            s=Submission.objects.get(id=int(d['submission']));c=getcourse(u,s.task.course_id);staff(u,c)
            s.grade=integer(d['grade'],0,s.task.points);s.feedback=str(d.get('feedback',''))[:2000];s.save()
        elif path=='course':
            if u.profile.role!='admin':raise PermissionError('Solo administración puede crear aulas.')
            teacher=User.objects.get(id=int(d['teacher']),profile__role='teacher',is_active=True)
            c=Course.objects.create(title=text(d,'title'),code=text(d,'code',40),summary=str(d.get('summary',''))[:200],teacher=teacher,color=d.get('color','pink') if d.get('color','pink') in ['pink','purple','green','peach','blue','yellow'] else 'pink',symbol='flower',schedule=str(d.get('schedule',''))[:100])
            c.students.set(User.objects.filter(id__in=d.get('students',[]),profile__role='student',is_active=True))
        elif path=='membership':
            if u.profile.role!='admin':raise PermissionError('Solo administración puede gestionar matrículas.')
            c=getcourse(u,int(d['course']));c.students.set(User.objects.filter(id__in=d.get('students',[]),profile__role='student',is_active=True))
        elif path=='user':
            if u.profile.role!='admin':raise PermissionError('Solo administración puede crear cuentas.')
            email=text(d,'email',150).lower();validate_email(email)
            pw=text(d,'password',100)
            if len(pw)<10:raise ValueError('Usa una contraseña de al menos 10 caracteres.')
            role=d['role']
            if role not in ['teacher','student','admin']:raise ValueError('Rol inválido.')
            if User.objects.filter(email__iexact=email).exists():raise ValueError('El correo ya está registrado.')
            name=text(d,'name',100).split(' ',1)
            with transaction.atomic():
                nu=User.objects.create_user(username=email,email=email,password=pw,first_name=name[0],last_name=name[1] if len(name)>1 else '')
                Profile.objects.create(user=nu,role=role)
        elif path=='event':
            staff(u);Event.objects.create(title=text(d,'title'),date=date.fromisoformat(d['date']),time=text(d,'time',30),kind=str(d.get('kind','Campus'))[:30],description=str(d.get('description',''))[:2000])
        elif path=='resource':
            c=getcourse(u,int(d['course']));staff(u,c);url=str(d.get('url','')).strip()
            if url:URLValidator(schemes=['http','https'])(url)
            Resource.objects.create(course=c,title=text(d,'title'),url=url,body=str(d.get('body',''))[:10000])
        elif path=='attendance':
            c=getcourse(u,int(d['course']));staff(u,c);day=date.fromisoformat(d['date'])
            with transaction.atomic():
                for row in d['rows']:
                    if not c.students.filter(id=row['student']).exists():raise ValueError('Estudiante fuera del aula.')
                    Attendance.objects.update_or_create(course=c,student_id=row['student'],date=day,defaults={'present':bool(row['present'])})
        else:return JsonResponse({'error':'Ruta desconocida.'},status=404)
        return JsonResponse(state(u))
    except PermissionError as e:return JsonResponse({'error':str(e)},status=403)
    except (ValueError,KeyError,TypeError,ValidationError,IntegrityError) as e:return JsonResponse({'error':str(e) if not isinstance(e,IntegrityError) else 'Ya existe un registro con esos datos.'},status=400)
    except (User.DoesNotExist,Task.DoesNotExist,Submission.DoesNotExist):return JsonResponse({'error':'Registro no encontrado.'},status=404)
