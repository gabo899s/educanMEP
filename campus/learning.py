"""Private student workspace and explicitly shared work. All writes are ownership checked."""
import hashlib
import json
import re
from datetime import date, time
from django.core.files.base import ContentFile
from django.db import transaction
from django.db.models import F, Prefetch
from django.http import HttpResponse
from django.utils import timezone
from .models import (Course, Task, Submission, PlannerEntry, LearningGoal, StudentNote,
                     PortfolioEntry, HelpRequest, HelpReply, FeedbackReceipt)

LEARNING_ACTIONS={'planner','planner-edit','planner-toggle','planner-delete','goal','goal-edit','goal-progress','goal-delete',
 'note','note-edit','note-pin','note-delete','portfolio','portfolio-edit','portfolio-delete','student-settings','feedback-read',
 'help-ask','help-reply','help-status','course-timetable'}
HOME_CARDS=['classes','tasks','planner','goals','progress','notes']
AVATARS={'initials','flower','orbit','leaf','sun','star','spark'}
COVERS={'garden','constellation','sunrise','confetti'}

def obj_json(d,key,default):
    value=d.get(key,default)
    return json.loads(value) if isinstance(value,str) else value

def tags(value,limit=8):
    from .views import text
    if not isinstance(value,list) or len(value)>limit: raise ValueError(f'Elige hasta {limit} etiquetas o intereses.')
    clean=[text({'tag':s},'tag',30) for s in value]
    if len(set(clean))!=len(clean): raise ValueError('Las etiquetas deben ser distintas.')
    return clean

def appearance_schema(d,current=None):
    from .views import boolean
    current=current or {}
    if not isinstance(d,dict): raise ValueError('Revisa tus opciones de accesibilidad.')
    value={'accent':d.get('accent',current.get('accent','institution')),'density':d.get('density',current.get('density','comfortable')),
           'reduce_motion':d.get('reduce_motion',current.get('reduce_motion',False)),
           'font_size':d.get('font_size',current.get('font_size','standard')),
           'high_contrast':d.get('high_contrast',current.get('high_contrast',False))}
    if value['accent'] not in ['institution','pink','purple','green','peach','blue','yellow'] or value['density'] not in ['comfortable','compact'] or value['font_size'] not in ['standard','large','extra']:
        raise ValueError('Selecciona opciones de apariencia válidas.')
    boolean(value['reduce_motion']);boolean(value['high_contrast'])
    return value

def own(model,u,identifier):
    from .views import integer
    record=model.objects.get(id=integer(identifier,1,2**63-1))
    if record.student_id!=u.id: raise PermissionError('Este registro pertenece a otro estudiante.')
    return record

def student_course(u,identifier,existing=None):
    from .views import getcourse,integer
    if identifier in (None,'',0): return None
    identifier=integer(identifier,1,2**63-1)
    if existing and existing.course_id==identifier:
        return Course.objects.get(id=identifier)
    return getcourse(u,identifier)

def fingerprint(s):
    payload={'grade':s.grade,'feedback':s.feedback,'assessment':s.rubric_assessment,
             'reviewed_at':s.reviewed_at.isoformat() if s.reviewed_at else None}
    return hashlib.sha256(json.dumps(payload,sort_keys=True,ensure_ascii=False).encode()).hexdigest()

def shared_portfolios(u):
    if u.profile.role!='teacher': return PortfolioEntry.objects.none()
    return PortfolioEntry.objects.filter(sharing='teacher',course__teacher=u,course__archived=False,
                                        course__students=F('student')).distinct()

def portfolio_record(u,identifier):
    from .views import integer
    p=PortfolioEntry.objects.get(id=integer(identifier,1,2**63-1))
    if p.student_id==u.id or shared_portfolios(u).filter(id=p.id).exists(): return p
    raise PermissionError('Esta entrada de portafolio es privada.')

def help_record(u,identifier,writing=False):
    from .views import integer,getcourse
    h=HelpRequest.objects.select_related('task__course','student').get(id=integer(identifier,1,2**63-1))
    c=h.task.course
    owner=h.student_id==u.id and u.profile.role=='student'
    teacher=u.profile.role=='teacher' and c.teacher_id==u.id and not c.archived
    if not owner and not teacher: raise PermissionError('Esta consulta pertenece al estudiante y a su profesor.')
    if writing: getcourse(u,c.id)
    return h

def portfolio_list(query):
    return [{'id':p.id,'student':p.student_id,'student_name':p.student.get_full_name() or p.student.username,
             'course':p.course_id,'course_title':p.course.title if p.course else '',
             'submission':p.submission_id,'task_title':p.submission.task.title if p.submission else '',
             'title':p.title,'reflection':p.reflection,'tags':p.tags,'sharing':p.sharing,'file':p.original_name,
             'artifact':p.artifact, 'updated':p.updated.isoformat()} for p in query.select_related('course','submission__task','student').order_by('-updated','id')]

def help_list(query):
    query=query.select_related('task__course','student').prefetch_related(Prefetch('replies',queryset=HelpReply.objects.select_related('author').order_by('created','id'))).order_by('-updated','-id')
    return [{'id':h.id,'student':h.student_id,'student_name':h.student.get_full_name() or h.student.username,
             'task':h.task_id,'task_title':h.task.title,'course':h.task.course_id,'course_title':h.task.course.title,
             'teacher':h.task.course.teacher_id,'question':h.question,'status':h.status,'file':h.original_name,
             'created':h.created.isoformat(),'updated':h.updated.isoformat(),
             'replies':[{'id':r.id,'author':r.author_id,'author_name':r.author.get_full_name() or r.author.username,
                         'body':r.body,'created':r.created.isoformat()} for r in h.replies.all()]} for h in query]

def learning_state(u):
    if u.profile.role!='student': return None
    submissions=list(Submission.objects.filter(student=u,grade__isnull=False))
    receipts={r.submission_id:r.fingerprint for r in FeedbackReceipt.objects.filter(submission__student=u)}
    return {'planner':list(PlannerEntry.objects.filter(student=u).order_by('date','time','id').values('id','course_id','task_id','title','kind','date','time','duration','priority','remind_minutes','notes','completed','updated',course_title=F('course__title'))),
            'goals':list(LearningGoal.objects.filter(student=u).order_by('due','id').values('id','course_id','title','due','target','progress','unit','reflection','updated',course_title=F('course__title'))),
            'notes':list(StudentNote.objects.filter(student=u).order_by('-pinned','-updated','id').values('id','course_id','title','body','tags','pinned','updated',course_title=F('course__title'))),
            'portfolio':portfolio_list(PortfolioEntry.objects.filter(student=u)),
            'help':help_list(HelpRequest.objects.filter(student=u)),
            'feedback_seen':[s.id for s in submissions if receipts.get(s.id)==fingerprint(s)]}

def received_state(u):
    if u.profile.role!='teacher': return None
    return {'portfolio':portfolio_list(shared_portfolios(u)),
            'help':help_list(HelpRequest.objects.filter(task__course__teacher=u,task__course__archived=False))}

def delete_file(record):
    if record.file:
        name,storage=record.file.name,record.file.storage
        transaction.on_commit(lambda:storage.delete(name))

def timetable_schema(value):
    from .views import integer,text
    if not isinstance(value,list) or len(value)>14: raise ValueError('Define hasta 14 bloques semanales.')
    clean=[]
    for row in value:
        if not isinstance(row,dict): raise ValueError('Bloque de horario inválido.')
        weekday=integer(row.get('weekday'),0,6)
        start=text(row,'start',5);end=text(row,'end',5)
        if not re.fullmatch(r'\d{2}:\d{2}',start) or not re.fullmatch(r'\d{2}:\d{2}',end): raise ValueError('Usa horas en formato HH:MM.')
        time.fromisoformat(start);time.fromisoformat(end)
        if start>=end: raise ValueError('La hora de fin debe ser posterior al inicio.')
        entry={'weekday':weekday,'start':start,'end':end,'room':text(row,'room',60,False)}
        if any(r['weekday']==weekday and start<r['end'] and end>r['start'] for r in clean):
            raise ValueError('Los bloques de una materia no pueden superponerse.')
        clean.append(entry)
    return sorted(clean,key=lambda r:(r['weekday'],r['start']))

def mutate_learning(request,u,path,d):
    if path not in LEARNING_ACTIONS: return False
    from .views import text,integer,boolean,getcourse,staff,upload,replace_file
    if path=='course-timetable':
        c=getcourse(u,d.get('course'));staff(u,c)
        c.timetable=timetable_schema(d.get('timetable'));c.save(update_fields=['timetable']);return True
    if path=='help-reply':
        h=help_record(u,d.get('id'),writing=True)
        if h.status=='resolved': raise ValueError('Reabre la consulta antes de responder.')
        HelpReply.objects.create(request=h,author=u,body=text(d,'body',4000))
        h.status='open' if h.student_id==u.id else 'answered';h.save(update_fields=['status','updated']);return True
    if u.profile.role!='student': raise PermissionError('Este espacio personal corresponde al estudiante.')
    if path=='student-settings':
        p=u.profile
        avatar,cover=d.get('avatar','initials'),d.get('cover','garden')
        if avatar not in AVATARS or cover not in COVERS: raise ValueError('Elige un avatar y una portada válidos.')
        order=d.get('home_order',HOME_CARDS);hidden=d.get('home_hidden',[])
        if not isinstance(order,list) or len(order)!=len(HOME_CARDS) or set(order)!=set(HOME_CARDS): raise ValueError('Revisa el orden de las tarjetas de inicio.')
        if not isinstance(hidden,list) or len(set(hidden))!=len(hidden) or len(hidden)>5 or not set(hidden)<=set(HOME_CARDS): raise ValueError('Conserva al menos una tarjeta de inicio.')
        appearance=appearance_schema(d.get('appearance',{}),p.preferences.get('appearance',{}))
        p.preferences={**p.preferences,'student':{'avatar':avatar,'cover':cover,'interests':tags(d.get('interests',[])),
                                               'home_order':order,'home_hidden':hidden},'appearance':appearance}
        p.save(update_fields=['preferences'])
    elif path=='feedback-read':
        s=Submission.objects.get(id=integer(d.get('submission'),1,2**63-1),student=u,grade__isnull=False)
        FeedbackReceipt.objects.update_or_create(submission=s,defaults={'fingerprint':fingerprint(s)})
    elif path.startswith('planner'):
        p=PlannerEntry(student=u) if path=='planner' else own(PlannerEntry,u,d.get('id'))
        if path=='planner-delete':p.delete()
        elif path=='planner-toggle':p.completed=boolean(d.get('completed'));p.save(update_fields=['completed','updated'])
        else:
            kind,priority=d.get('kind','personal'),d.get('priority','normal')
            if kind not in ['personal','reminder','study'] or priority not in ['low','normal','high']: raise ValueError('Revisa el tipo y la prioridad de tu agenda.')
            p.title=text(d,'title',160);p.kind=kind;p.priority=priority;p.date=date.fromisoformat(d['date'])
            clock=text(d,'time',5,False)
            if clock:
                if not re.fullmatch(r'\d{2}:\d{2}',clock): raise ValueError('Usa una hora HH:MM.')
                time.fromisoformat(clock)
            p.time=clock;p.duration=integer(d.get('duration',30),5,480)
            reminder=integer(d.get('remind_minutes',60),0,1440)
            if reminder not in [0,15,60,1440]: raise ValueError('Selecciona un recordatorio válido.')
            p.remind_minutes=reminder;p.notes=text(d,'notes',2000,False)
            p.course=student_course(u,d.get('course'),p if p.pk else None)
            task_id=d.get('task')
            if task_id not in (None,'',0):
                task=Task.objects.get(id=integer(task_id,1,2**63-1))
                if not (p.pk and p.task_id==task.id and p.course_id==task.course_id): getcourse(u,task.course_id)
                if p.course_id and p.course_id!=task.course_id: raise ValueError('La actividad debe pertenecer a la materia elegida.')
                p.course=task.course;p.task=task
            else:p.task=None
            p.save()
    elif path.startswith('goal'):
        g=LearningGoal(student=u) if path=='goal' else own(LearningGoal,u,d.get('id'))
        if path=='goal-delete':g.delete()
        elif path=='goal-progress':g.progress=integer(d.get('progress'),0,g.target);g.save(update_fields=['progress','updated'])
        else:
            g.title=text(d,'title',160);g.due=date.fromisoformat(d['due']);g.target=integer(d.get('target',5),1,1000)
            g.progress=integer(d.get('progress',g.progress),0,g.target);g.unit=text(d,'unit',30)
            g.reflection=text(d,'reflection',2000,False);g.course=student_course(u,d.get('course'),g if g.pk else None);g.save()
    elif path.startswith('note'):
        n=StudentNote(student=u) if path=='note' else own(StudentNote,u,d.get('id'))
        if path=='note-delete':n.delete()
        elif path=='note-pin':n.pinned=boolean(d.get('pinned'));n.save(update_fields=['pinned','updated'])
        else:
            n.title=text(d,'title',160);n.body=text(d,'body',20000)
            n.tags=tags(d.get('tags',[]));n.course=student_course(u,d.get('course'),n if n.pk else None);n.save()
    elif path.startswith('portfolio'):
        p=PortfolioEntry(student=u) if path=='portfolio' else own(PortfolioEntry,u,d.get('id'))
        if path=='portfolio-delete':delete_file(p);p.delete()
        else:
            p.title=text(d,'title',160);p.reflection=text(d,'reflection',5000,False)
            p.tags=tags(obj_json(d,'tags',[]));p.course=student_course(u,d.get('course'),p if p.pk else None)
            source=d.get('submission'); source_record=None
            if source not in (None,'',0):
                s=Submission.objects.select_related('task').get(id=integer(source,1,2**63-1),student=u)
                if p.course_id and p.course_id!=s.task.course_id: raise ValueError('El trabajo y la materia no coinciden.')
                if p.submission_id!=s.id or not p.artifact:
                    p.artifact={'title':s.task.title,'body':s.body,'answers':s.answers,'fields':s.task.fields}
                    source_record=s
                p.submission=s;p.course=s.task.course
            else:p.submission=None
            sharing=d.get('sharing','private')
            if sharing not in ['private','teacher']: raise ValueError('Elige una opción de privacidad válida.')
            if sharing=='teacher':
                if not p.course_id: raise ValueError('Elige una materia para compartir con su profesor.')
                getcourse(u,p.course_id)
            p.sharing=sharing
            f=upload(request)
            if not p.reflection and not p.submission_id and not f and not p.file: raise ValueError('Añade una reflexión, un trabajo entregado o un archivo.')
            p.save()
            if f:replace_file(p,f)
            elif source_record and source_record.file and not p.file:
                with source_record.file.open('rb') as original:
                    saved=original.read(5*1024*1024+1)
                if len(saved)>5*1024*1024: raise ValueError('El archivo original supera 5 MB.')
                replace_file(p,ContentFile(saved,name=source_record.original_name or 'Trabajo'))
    elif path=='help-ask':
        task=Task.objects.get(id=integer(d.get('task'),1,2**63-1));getcourse(u,task.course_id)
        h=HelpRequest.objects.create(student=u,task=task,question=text(d,'question',4000))
        f=upload(request)
        if f:replace_file(h,f)
    elif path=='help-status':
        h=help_record(u,d.get('id'),writing=True)
        if h.student_id!=u.id: raise PermissionError('El estudiante decide si su consulta está resuelta.')
        status=d.get('status')
        if status not in ['open','resolved']: raise ValueError('Estado de consulta inválido.')
        h.status=status;h.save(update_fields=['status','updated'])
    return True

def notes_export(u,identifier=None):
    if u.profile.role!='student': raise PermissionError('El cuaderno es privado del estudiante.')
    notes=[own(StudentNote,u,identifier)] if identifier else list(StudentNote.objects.filter(student=u).select_related('course').order_by('-pinned','title','id'))
    content='\n\n---\n\n'.join('# '+n.title+'\n\n'+n.body+'\n\nEtiquetas: '+', '.join(n.tags) for n in notes)
    response=HttpResponse(content,content_type='text/markdown; charset=utf-8')
    response['Content-Disposition']=f'attachment; filename="Luma-apuntes{("-"+str(notes[0].id)) if identifier else ""}.md"'
    response['Cache-Control']='private, no-store'
    return response
