import csv
import hashlib
import io
import json
from datetime import date, time
from pathlib import Path

from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.core.validators import URLValidator, validate_email
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.http import FileResponse, HttpResponse, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import Attendance, Course, Draft, Event, Message, Post, Profile, Resource, Submission, Task, TeachingTemplate
from .settings import BASE_DIR
from .permissions import authorize, permissions
from .administration import institution_state, admin_state, admin_mutate, check_module, log_change, ADMIN_ACTIONS
from .teaching import rubric_schema, fields_schema, field_answers, rubric_assessment

COLORS = {'pink', 'purple', 'green', 'peach', 'blue', 'yellow'}
SYMBOLS = {'flower', 'orbit', 'leaf', 'sun', 'star', 'spark'}

def person(u, private=False):
    p = u.profile
    result = {'id': u.id, 'name': u.get_full_name() or u.username, 'email': u.email,
              'role': p.role, 'bio': p.bio, 'color': p.color}
    if private:
        result.update(phone=p.phone, preferences=p.preferences, permissions=permissions(u))
    return result

def courses(u):
    role = u.profile.role
    query = Course.objects.all() if role == 'admin' else Course.objects.filter(teacher=u) if role == 'teacher' else u.courses.all()
    if role not in ['admin', 'teacher', 'student']:
        query = Course.objects.none()
    if role != 'admin':
        query = query.filter(archived=False)
    return query.order_by('title').prefetch_related('students')

def getcourse(u, identifier):
    try:
        return courses(u).get(id=integer(identifier, 1, 2**63-1))
    except Course.DoesNotExist:
        raise PermissionError('No tienes acceso a esta aula.')

def staff(u, c=None):
    if c and c.archived:
        raise ValueError('Restaura la materia antes de modificar su contenido académico.')
    if u.profile.role == 'admin' or (u.profile.role == 'teacher' and (c is None or c.teacher_id == u.id)):
        return
    raise PermissionError('Esta acción requiere un profesor o administrador.')

def admin(u):
    if u.profile.role != 'admin':
        raise PermissionError('Esta acción corresponde a administración.')

def text(d, key, limit=200, required=True):
    value = d.get(key, '')
    if not isinstance(value, str):
        raise ValueError(f'El campo {key} debe contener texto.')
    value = value.strip()
    if (required and not value) or len(value) > limit:
        raise ValueError(f'Completa {key} con un máximo de {limit} caracteres.')
    return value

def integer(value, low=0, high=100):
    if isinstance(value, bool) or isinstance(value, float) and not value.is_integer():
        raise ValueError('Introduce un número entero válido.')
    value = int(value)
    if not low <= value <= high:
        raise ValueError(f'El valor debe estar entre {low} y {high}.')
    return value

def boolean(value):
    if not isinstance(value, bool):
        raise ValueError('El estado debe ser verdadero o falso.')
    return value

def students(d):
    identifiers = d.get('students', [])
    if not isinstance(identifiers, list):
        raise ValueError('Selecciona una lista de estudiantes.')
    identifiers = set(integer(i, 1, 2**63-1) for i in identifiers)
    users = list(User.objects.filter(id__in=identifiers, profile__role='student', is_active=True))
    if len(users) != len(identifiers):
        raise ValueError('La matrícula contiene estudiantes no válidos.')
    return users

def upload(request):
    f = request.FILES.get('file')
    if f and f.size > 5 * 1024 * 1024:
        raise ValueError('El archivo no puede superar 5 MB.')
    return f

def replace_file(record, f):
    previous = record.file.name
    record.file = f
    record.original_name = Path(f.name).name[:255]
    record.save()
    if previous and previous != record.file.name:
        storage = record.file.storage
        transaction.on_commit(lambda: storage.delete(previous))

def state(u):
    cs = list(courses(u))
    ids = [c.id for c in cs]
    tasks = Task.objects.filter(course_id__in=ids).order_by('due', 'id')
    submissions = Submission.objects.filter(task__course_id__in=ids).order_by('id')
    attendance = Attendance.objects.filter(course_id__in=ids).order_by('-date', 'id')
    if u.profile.role == 'student':
        submissions = submissions.filter(student=u)
        attendance = attendance.filter(student=u)
    locked_tasks = set(submissions.values_list('task_id', flat=True)) | set(Draft.objects.filter(task__course_id__in=ids).values_list('task_id', flat=True))
    people = User.objects.filter(is_active=True, profile__isnull=False).select_related('profile').order_by('first_name', 'id')
    return {
        'institution': institution_state(), 'administration': admin_state(u),
        'me': person(u, private=True), 'people': [person(p) for p in people],
        'courses': [{'id': c.id, 'title': c.title, 'code': c.code, 'summary': c.summary, 'teacher': c.teacher_id,
                     'students': [p.id for p in c.students.all()], 'color': c.color, 'symbol': c.symbol,
                     'schedule': c.schedule, 'room': c.room, 'archived': c.archived} for c in cs],
        'tasks': [{'id': t.id, 'course': t.course_id, 'title': t.title, 'description': t.description,
                   'due': str(t.due), 'points': t.points, 'closed': t.closed,
                   'kind': t.kind, 'submission_mode': t.submission_mode, 'allow_late': t.allow_late, 'color': t.color, 'rubric': t.rubric, 'fields': t.fields,
                   'configuration_locked': t.id in locked_tasks} for t in tasks],
        'submissions': [{'id': s.id, 'task': s.task_id, 'student': s.student_id, 'body': s.body, 'file': s.original_name,
                         'grade': s.grade, 'feedback': s.feedback, 'answers': s.answers, 'rubric_assessment': s.rubric_assessment, 'created': s.created.isoformat()} for s in submissions],
        'posts': [{'id': p.id, 'course': p.course_id, 'author': p.author_id, 'body': p.body,
                   'pinned': p.pinned, 'created': p.created.isoformat()}
                  for p in Post.objects.filter(course_id__in=ids).order_by('-pinned', '-created', '-id')],
        'messages': [{'id': m.id, 'sender': m.sender_id, 'recipient': m.recipient_id, 'body': m.body,
                      'created': m.created.isoformat(), 'read': m.read}
                     for m in Message.objects.filter(Q(sender=u) | Q(recipient=u)).order_by('created', 'id')],
        'events': list(Event.objects.order_by('date', 'time', 'id').values('id', 'title', 'date', 'time', 'kind', 'description', 'author_id')),
        'resources': [{'id': r.id, 'course_id': r.course_id, 'title': r.title, 'url': r.url, 'body': r.body,
                       'file': r.original_name} for r in Resource.objects.filter(course_id__in=ids).order_by('-id')],
        'attendance': list(attendance.values('id', 'course_id', 'student_id', 'date', 'present')),
        'teaching_templates': list(TeachingTemplate.objects.filter(author=u).order_by('-updated','id').values('id','kind','title','definition','updated')) if 'teaching.customize' in permissions(u) else [],
        'drafts': list(Draft.objects.filter(student=u, task__course_id__in=ids).order_by('id').values('task_id', 'body', 'answers', 'updated')),
    }

def state_response(request, u):
    response = JsonResponse(state(u))
    etag = '"' + hashlib.sha256(response.content).hexdigest() + '"'
    if request.method == 'GET' and request.headers.get('If-None-Match', '').removeprefix('W/') == etag:
        response = HttpResponse(status=304)
    response['ETag'] = etag
    response['Cache-Control'] = 'private, no-cache'
    response['Vary'] = 'Cookie'
    return response

@ensure_csrf_cookie
def index(request):
    response = FileResponse(open(BASE_DIR / 'public' / 'index.html', 'rb'), content_type='text/html')
    response['Cache-Control'] = 'no-cache'
    return response

def asset(request, name):
    if name not in ['app.js', 'administration.js', 'teaching.js', 'style.css', 'manrope.ttf', 'dmsans.ttf', 'favicon.svg']:
        return HttpResponse(status=404)
    path = BASE_DIR / 'public' / name
    etag = f'"{path.stat().st_mtime_ns:x}-{path.stat().st_size:x}"'
    if request.headers.get('If-None-Match', '').removeprefix('W/') == etag:
        response = HttpResponse(status=304)
    else:
        types = {'.ttf': 'font/ttf', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml'}
        response = FileResponse(open(path, 'rb'), content_type=types[path.suffix])
    response['ETag'] = etag
    response['Cache-Control'] = 'public, max-age=3600'
    return response

def download(record):
    if not record.file:
        return JsonResponse({'error': 'El archivo no está disponible.'}, status=404)
    response = FileResponse(record.file.open('rb'), as_attachment=True, filename=record.original_name)
    response['Cache-Control'] = 'private, no-store'
    return response

def export_grades(u):
    records = Submission.objects.filter(task__course__in=courses(u), grade__isnull=False).select_related('task__course', 'student')
    if u.profile.role == 'student':
        records = records.filter(student=u)
    output = io.StringIO()
    writer = csv.writer(output)
    def safe(value):
        value = str(value)
        return "'" + value if value.lstrip().startswith(('=', '+', '-', '@')) else value
    writer.writerow(['Estudiante', 'Aula', 'Actividad', 'Calificación', 'Puntos', 'Porcentaje', 'Retroalimentación'])
    for s in records.order_by('task__course__title', 'student__first_name', 'id'):
        writer.writerow([safe(s.student.get_full_name()), safe(s.task.course.title), safe(s.task.title), s.grade,
                         s.task.points, round(s.grade / s.task.points * 100, 2), safe(s.feedback)])
    response = HttpResponse('\ufeff' + output.getvalue(), content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = 'attachment; filename="luma-calificaciones.csv"'
    response['Cache-Control'] = 'private, no-store'
    return response

def task_options(d, task=None):
    kind = d.get('kind', task.kind if task else 'assignment')
    mode = d.get('submission_mode', task.submission_mode if task else 'both')
    color = d.get('color', task.color if task else 'purple')
    late = d.get('allow_late', task.allow_late if task else True)
    if kind not in {'assignment', 'project', 'quiz', 'reading'} or mode not in {'both', 'text', 'file'} or color not in COLORS:
        raise ValueError('Selecciona opciones válidas para la actividad.')
    return {'kind': kind, 'submission_mode': mode, 'allow_late': boolean(late), 'color': color}

def mutate(request, u, path, d):
    authorize(u, path)
    check_module(path)
    if admin_mutate(request, u, path, d):
        return
    if path == 'teaching-preferences':
        options = task_options(d)
        points, days = integer(d.get('points',100),1,1000), integer(d.get('due_days',7),1,60)
        bank = d.get('feedback_bank',[])
        if not isinstance(bank,list) or len(bank)>10:
            raise ValueError('Guarda hasta 10 comentarios frecuentes.')
        bank=[text({'comment':comment},'comment',1000) for comment in bank]
        p=u.profile
        p.preferences={**p.preferences,'teaching':{**options,'points':points,'due_days':days,'feedback_bank':bank}}
        p.save(update_fields=['preferences'])
    elif path in ['teaching-template','teaching-template-edit','teaching-template-delete']:
        if path == 'teaching-template':
            template=TeachingTemplate(author=u)
        else:
            template=TeachingTemplate.objects.get(id=d['id'])
            if template.author_id != u.id:
                raise PermissionError('Esta plantilla pertenece a otro docente.')
        if path == 'teaching-template-delete':
            template.delete()
        else:
            kind=d.get('kind',template.kind)
            if kind not in ['rubric','fields'] or template.pk and kind != template.kind:
                raise ValueError('El tipo de plantilla no es válido.')
            definition=rubric_schema(d.get('definition')) if kind=='rubric' else fields_schema(d.get('definition'))
            if not definition:
                raise ValueError('Añade al menos un criterio o campo a la plantilla.')
            template.title=text(d,'title',120)
            template.kind,template.definition=kind,definition
            template.save()
    elif path == 'profile':
        name = text(d, 'name', 100).split(' ', 1)
        bio = text(d, 'bio', 1000, False)
        phone = text(d, 'phone', 40, False)
        color = d.get('color', u.profile.color)
        if color not in COLORS:
            raise ValueError('Selecciona un color válido.')
        u.first_name, u.last_name = name[0], name[1] if len(name) > 1 else ''
        u.save()
        p = u.profile
        p.bio, p.phone, p.color = bio, phone, color
        p.save()
    elif path == 'appearance':
        accent, density = d.get('accent', 'purple'), d.get('density', 'comfortable')
        motion = boolean(d.get('reduce_motion', False))
        if accent not in COLORS or density not in {'comfortable', 'compact'}:
            raise ValueError('Selecciona una apariencia válida.')
        p = u.profile
        p.preferences = {**p.preferences, 'appearance': {'accent': accent, 'density': density, 'reduce_motion': motion}}
        p.save(update_fields=['preferences'])
    elif path == 'favorite':
        c = getcourse(u, d['course'])
        p = u.profile
        favorites = set(p.preferences.get('favorites', []))
        if boolean(d.get('favorite', True)):
            favorites.add(c.id)
        else:
            favorites.discard(c.id)
        p.preferences = {**p.preferences, 'favorites': sorted(favorites)}
        p.save(update_fields=['preferences'])
    elif path == 'password':
        if not u.check_password(d.get('current', '')):
            raise ValueError('La contraseña actual no es correcta.')
        pw = text(d, 'password', 100)
        if len(pw) < 10:
            raise ValueError('Usa al menos 10 caracteres.')
        u.set_password(pw)
        u.save()
        update_session_auth_hash(request, u)
    elif path == 'message':
        to = User.objects.get(id=integer(d['recipient'], 1, 2**63-1), is_active=True, profile__isnull=False)
        if to.id == u.id:
            raise ValueError('Elige otro destinatario.')
        Message.objects.create(sender=u, recipient=to, body=text(d, 'body', 4000))
    elif path == 'read':
        Message.objects.filter(sender_id=integer(d['sender'], 1, 2**63-1), recipient=u, read=False).update(read=True)
    elif path in ['post', 'post-edit', 'post-pin', 'post-delete']:
        if path == 'post':
            c = getcourse(u, d['course'])
            if c.archived: raise ValueError('Restaura la materia antes de modificar su contenido académico.')
            Post.objects.create(course=c, author=u, body=text(d, 'body', 4000))
        else:
            p = Post.objects.get(id=d['id'])
            c = getcourse(u, p.course_id)
            if c.archived: raise ValueError('Restaura la materia antes de modificar su contenido académico.')
            if p.author_id != u.id or path == 'post-pin':
                staff(u, c)
            if path == 'post-delete':
                p.delete()
            elif path == 'post-pin':
                p.pinned = boolean(d['pinned'])
                p.save(update_fields=['pinned'])
            else:
                p.body = text(d, 'body', 4000)
                p.save(update_fields=['body'])
    elif path in ['task', 'task-edit', 'task-toggle']:
        if path == 'task':
            c = getcourse(u, d['course'])
            staff(u, c)
            Task.objects.create(course=c, title=text(d, 'title'), description=text(d, 'description', 5000),
                                due=date.fromisoformat(d['due']), points=integer(d.get('points', 100), 1, 1000), **task_options(d), rubric=rubric_schema(d.get('rubric',{})), fields=fields_schema(d.get('fields',[])))
        else:
            t = Task.objects.get(id=d['id'])
            c = getcourse(u, t.course_id)
            staff(u, c)
            if path == 'task-toggle':
                t.closed = boolean(d['closed'])
            else:
                points = integer(d.get('points', t.points), 1, 1000)
                if points != t.points and t.submission_set.exists():
                    raise ValueError('No puedes cambiar los puntos de una actividad con entregas.')
                t.title, t.description = text(d, 'title'), text(d, 'description', 5000)
                t.due, t.points = date.fromisoformat(d['due']), points
                options = task_options(d, t)
                if options['submission_mode'] != t.submission_mode and t.submission_set.exists():
                    raise ValueError('Con entregas existentes, conserva el formato de entrega.')
                rubric=rubric_schema(d.get('rubric',t.rubric)); fields=fields_schema(d.get('fields',t.fields))
                if (rubric != rubric_schema(t.rubric) or fields != fields_schema(t.fields)) and (t.submission_set.exists() or t.draft_set.exists()):
                    raise ValueError('La rúbrica y los campos están protegidos porque ya hay entregas o borradores.')
                t.rubric,t.fields=rubric,fields
                for key, value in options.items():
                    setattr(t, key, value)
            t.save()
    elif path in ['submit', 'draft']:
        t = Task.objects.get(id=d['task'])
        getcourse(u, t.course_id)
        if u.profile.role != 'student':
            raise PermissionError('Las entregas corresponden a estudiantes.')
        if t.closed:
            raise ValueError('Esta actividad está cerrada. Contacta a tu profesor para reabrirla.')
        if Submission.objects.filter(task=t, student=u, grade__isnull=False).exists():
            raise ValueError('La entrega ya fue calificada.')
        body = text(d, 'body', 10000, False)
        answers = d.get('answers',{})
        if isinstance(answers,str):
            answers=json.loads(answers)
        answers=field_answers(t.fields,answers,complete=path=='submit')
        if path == 'draft':
            Draft.objects.update_or_create(task=t, student=u, defaults={'body': body,'answers':answers})
        else:
            f = upload(request)
            if not t.allow_late and timezone.localdate() > t.due:
                raise ValueError('La fecha de entrega terminó y esta actividad no admite entregas tardías.')
            if t.submission_mode == 'text' and f:
                raise ValueError('Esta actividad solo acepta una respuesta de texto.')
            if t.submission_mode == 'text' and not body and not answers:
                raise ValueError('Escribe la respuesta de texto requerida.')
            existing_file = Submission.objects.filter(task=t, student=u).exclude(file='').exists()
            if t.submission_mode == 'file' and not f and not existing_file:
                raise ValueError('Adjunta el archivo requerido para esta actividad.')
            if not body and not f and not existing_file and not answers:
                raise ValueError('Escribe tu respuesta o adjunta un archivo.')
            s, _ = Submission.objects.get_or_create(task=t, student=u)
            s.body, s.answers = body, answers
            s.save()
            if f:
                replace_file(s, f)
            Draft.objects.filter(task=t, student=u).delete()
    elif path == 'grade':
        s = Submission.objects.select_related('task').get(id=d['submission'])
        staff(u, getcourse(u, s.task.course_id))
        if s.task.rubric:
            assessment=rubric_assessment(s.task.rubric,d.get('rubric_selections'),d.get('criterion_feedback',{}),s.task.points)
            s.grade,s.rubric_assessment=assessment['grade'],assessment
        else:
            s.grade=integer(d['grade'],0,s.task.points)
            s.rubric_assessment={}
        s.feedback=text(d,'feedback',2000,False)
        s.save(update_fields=['grade','feedback','rubric_assessment'])
    elif path in ['course', 'course-edit']:
        admin(u)
        teacher = User.objects.get(id=d['teacher'], profile__role='teacher', is_active=True)
        color, symbol = d.get('color', 'pink'), d.get('symbol', 'flower')
        if color not in COLORS or symbol not in SYMBOLS:
            raise ValueError('Selecciona un color y una ilustración válidos.')
        values = dict(title=text(d, 'title'), code=text(d, 'code', 40), summary=text(d, 'summary', 200, False),
                      teacher=teacher, color=color, symbol=symbol, schedule=text(d, 'schedule', 100, False), room=text(d, 'room', 60, False) or '10-A')
        if path == 'course':
            members = students(d)
            c = Course.objects.create(**values)
            c.students.set(members)
        else:
            c = getcourse(u, d['id'])
            for key, value in values.items():
                setattr(c, key, value)
            c.save()
    elif path == 'membership':
        admin(u)
        c=getcourse(u,d['course'])
        if c.archived: raise ValueError('Restaura la materia antes de modificar sus matrículas.')
        c.students.set(students(d))
    elif path in ['user', 'user-edit']:
        admin(u)
        email = text(d, 'email', 150).lower()
        validate_email(email)
        name = text(d, 'name', 100).split(' ', 1)
        if path == 'user':
            pw = text(d, 'password', 100)
            if len(pw) < 10:
                raise ValueError('Usa una contraseña de al menos 10 caracteres.')
            role = d['role']
            if role not in ['teacher', 'student', 'admin']:
                raise ValueError('Rol inválido.')
            if User.objects.filter(email__iexact=email).exists():
                raise ValueError('El correo ya está registrado.')
            nu = User.objects.create_user(username=email, email=email, password=pw, first_name=name[0], last_name=name[1] if len(name) > 1 else '')
            Profile.objects.create(user=nu, role=role)
        else:
            nu = User.objects.get(id=d['id'], is_active=True)
            if User.objects.filter(email__iexact=email).exclude(id=nu.id).exists():
                raise ValueError('El correo ya está registrado.')
            pw = text(d, 'password', 100, False)
            if pw and len(pw) < 10:
                raise ValueError('Usa una contraseña de al menos 10 caracteres.')
            nu.email, nu.first_name, nu.last_name = email, name[0], name[1] if len(name) > 1 else ''
            if pw:
                nu.set_password(pw)
            nu.save()
            if pw and nu.id == u.id:
                update_session_auth_hash(request, nu)
    elif path in ['event', 'event-edit', 'event-delete']:
        staff(u)
        if path == 'event':
            e = Event(author=u)
        else:
            e = Event.objects.get(id=d['id'])
            if u.profile.role != 'admin' and e.author_id != u.id:
                raise PermissionError('Solo puedes editar los eventos que creaste.')
        if path == 'event-delete':
            e.delete()
        else:
            event_time = text(d, 'time', 30)
            time.fromisoformat(event_time)
            e.title, e.date, e.time = text(d, 'title'), date.fromisoformat(d['date']), event_time
            e.kind, e.description = text(d, 'kind', 30, False) or 'Campus', text(d, 'description', 2000, False)
            e.save()
    elif path in ['resource', 'resource-edit', 'resource-delete']:
        if path == 'resource':
            c = getcourse(u, d['course'])
            r = Resource(course=c)
        else:
            r = Resource.objects.get(id=d['id'])
            c = getcourse(u, r.course_id)
        staff(u, c)
        if path == 'resource-delete':
            previous, storage = r.file.name, r.file.storage
            r.delete()
            if previous:
                transaction.on_commit(lambda: storage.delete(previous))
        else:
            url, body, f = text(d, 'url', 500, False), text(d, 'body', 10000, False), upload(request)
            if url:
                URLValidator(schemes=['http', 'https'])(url)
            if not url and not body and not f and not r.file:
                raise ValueError('Añade contenido, un enlace o un archivo al material.')
            r.title, r.url, r.body = text(d, 'title'), url, body
            r.save()
            if f:
                replace_file(r, f)
    elif path == 'attendance':
        c = getcourse(u, d['course'])
        staff(u, c)
        day = date.fromisoformat(d['date'])
        rows = d['rows']
        if not isinstance(rows, list):
            raise ValueError('La asistencia debe contener una lista de estudiantes.')
        members = {p.id for p in c.students.all()}
        seen = set()
        for row in rows:
            identifier = integer(row['student'], 1, 2**63-1)
            if identifier not in members or identifier in seen:
                raise ValueError('La asistencia contiene estudiantes fuera del aula o repetidos.')
            seen.add(identifier)
            Attendance.objects.update_or_create(course=c, student_id=identifier, date=day, defaults={'present': boolean(row['present'])})
    else:
        raise ObjectDoesNotExist('Ruta desconocida.')

def api(request, path):
    try:
        if request.method not in ['GET', 'POST']:
            return JsonResponse({'error': 'Método no permitido.'}, status=405)
        d = json.loads(request.body or '{}') if request.content_type == 'application/json' else request.POST
        if not isinstance(d, dict) and not hasattr(d, 'getlist'):
            raise ValueError('La solicitud debe contener un objeto con campos.')
        if path == 'institution' and request.method == 'GET':
            return JsonResponse(institution_state())
        if path == 'institution-logo' and request.method == 'GET':
            from .administration import logo_response
            return logo_response(request)
        if path == 'login' and request.method == 'POST':
            identifier = text(d, 'email', 150).lower()
            account = User.objects.filter(email__iexact=identifier, is_active=True, profile__isnull=False).first()
            u = authenticate(request, username=account.username if account else identifier, password=d.get('password', ''))
            if not u or not hasattr(u, 'profile'):
                return JsonResponse({'error': 'Correo o contraseña incorrectos.'}, status=401)
            login(request, u)
            return state_response(request, u)
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Inicia sesión para continuar.'}, status=401)
        u = request.user
        if path == 'state' and request.method == 'GET':
            return state_response(request, u)
        if path.startswith('file/') and request.method == 'GET':
            s = Submission.objects.select_related('task').get(id=int(path.split('/')[1]))
            c = getcourse(u, s.task.course_id)
            if s.student_id != u.id:
                staff(u, c)
            return download(s)
        if path.startswith('resource-file/') and request.method == 'GET':
            check_module('resource')
            r = Resource.objects.get(id=int(path.split('/')[1]))
            getcourse(u, r.course_id)
            return download(r)
        if path == 'grades-export' and request.method == 'GET':
            check_module(path)
            return export_grades(u)
        if path == 'people-export' and request.method == 'GET':
            admin(u)
            from .administration import people_export
            return people_export()
        if request.method != 'POST':
            return JsonResponse({'error': 'Método no permitido.'}, status=405)
        if path == 'logout':
            logout(request)
            return JsonResponse({'ok': True})
        with transaction.atomic():
            mutate(request, u, path, d)
            if path in ADMIN_ACTIONS:
                log_change(u, path, d)
        # Reload own profile after admin edits and any cached relation from authorization.
        u = User.objects.select_related('profile').get(id=u.id)
        return state_response(request, u)
    except PermissionError as e:
        return JsonResponse({'error': str(e)}, status=403)
    except IntegrityError:
        return JsonResponse({'error': 'Ya existe un registro con esos datos.'}, status=400)
    except ValidationError as e:
        return JsonResponse({'error': ' '.join(e.messages)}, status=400)
    except (ValueError, TypeError, OverflowError) as e:
        return JsonResponse({'error': str(e) or 'Revisa los datos de la solicitud.'}, status=400)
    except KeyError:
        return JsonResponse({'error': 'Faltan campos necesarios para guardar.'}, status=400)
    except ObjectDoesNotExist:
        return JsonResponse({'error': 'Registro no encontrado.'}, status=404)
    except FileNotFoundError:
        return JsonResponse({'error': 'El archivo ya no está disponible.'}, status=404)
