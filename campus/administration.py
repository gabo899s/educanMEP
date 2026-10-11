"""Institution settings and administrative operations; no access to private conversations."""
import csv
import io
import re
import struct
import zlib
from django.contrib.auth.models import User
from django.http import FileResponse, HttpResponse
from django.db import transaction
from django.db.models import Q
from django.core.validators import URLValidator
from .models import Institution, AdministrationLog, Course

MODULES = {'families':'Hogar y colegio','messages': 'Mensajería', 'calendar': 'Calendario', 'grades': 'Calificaciones',
           'attendance': 'Asistencia', 'studio': 'Estudio docente', 'materials': 'Materiales', 'wall': 'Muro del aula'}
CORE_LABELS = {'home': 'Mi inicio', 'classroom': 'Classroom', 'tasks': 'Actividades'}
from .families import ACTIONS as FAMILY_ACTIONS
ACTION_MODULES = {**{k:'families' for k in FAMILY_ACTIONS if k not in ['family-link','family-unlink','family-settings','family-push','family-push-delete']},'help-ask':'messages','help-reply':'messages', 'help-status':'messages','message': 'messages', 'read': 'messages', 'event': 'calendar', 'event-edit': 'calendar',
 'event-delete': 'calendar', 'grade': 'grades', **{k:'grades' for k in ['grade-draft','grade-discard','grade-publish']}, 'grades-export': 'grades', 'attendance': 'attendance',
 'resource': 'materials', 'resource-edit': 'materials', 'resource-delete': 'materials',
 'post': 'wall', 'post-edit': 'wall', 'post-delete': 'wall', 'post-pin': 'wall',
 'teaching-preferences': 'studio', 'teaching-template': 'studio', 'teaching-template-edit': 'studio', 'teaching-template-delete': 'studio'}
ADMIN_ACTIONS = {'institution', 'institution-logo', 'institution-logo-delete', 'user', 'user-edit', 'user-status',
                 'user-details', 'user-role', 'course', 'course-edit', 'course-archive', 'teacher-assign', 'membership', 'membership-bulk'}

def institution():
    return Institution.objects.get_or_create(pk=1)[0]

def institution_state():
    i = institution()
    modules = {k: {'enabled': True, 'label': label} for k, label in (CORE_LABELS | MODULES).items()}
    modules.update(i.modules)
    return {'name': i.name, 'short_name': i.short_name, 'motto': i.motto, 'year': i.year,
            'primary': i.primary, 'secondary': i.secondary, 'logo': '/api/institution-logo?v='+str(i.updated.timestamp()) if i.logo else '',
            'modules': modules, 'sections': i.sections}

def check_module(action):
    key = ACTION_MODULES.get(action)
    if key and not institution_state()['modules'][key]['enabled']:
        raise PermissionError('Este módulo está desactivado por la institución. Sus datos se conservan.')

def admin_state(u):
    if u.profile.role != 'admin':
        return None
    people = User.objects.filter(profile__isnull=False).exclude(email__iendswith='@luma.demo').select_related('profile').order_by('first_name','id')
    return {'people': [{'id': p.id, 'name': p.get_full_name() or p.username, 'email': p.email,
                        'role': p.profile.role, 'active': p.is_active, 'phone': p.profile.phone,
                        'bio': p.profile.bio, 'color': p.profile.color, 'department': p.profile.department,
                        'identifier': p.profile.identifier} for p in people],
            'log': list(AdministrationLog.objects.order_by('-created','-id')[:100].values('id','actor_name','action','summary','created'))}

def ids(d, key):
    from .views import integer
    raw = d.get(key, [])
    if not isinstance(raw,list) or not raw or len(raw)>1000:
        raise ValueError('Selecciona entre 1 y 1000 registros.')
    return set(integer(x,1,2**63-1) for x in raw)

def selected_courses(d):
    identifiers = ids(d,'courses')
    cs=list(Course.objects.filter(id__in=identifiers,archived=False))
    if len(cs)!=len(identifiers):
        raise ValueError('Selecciona materias activas y existentes.')
    return cs

def color(value, contrast=False):
    if not isinstance(value,str) or not re.fullmatch(r'#[0-9a-fA-F]{6}',value):
        raise ValueError('El color debe tener formato hexadecimal, por ejemplo #70547e.')
    if contrast:
        rgb=[int(value[i:i+2],16)/255 for i in (1,3,5)]
        rgb=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb]
        luminance=sum(a*b for a,b in zip(rgb,(.2126,.7152,.0722)))
        if 1.05/(luminance+.05)<4.5:
            raise ValueError('El color principal debe ser más oscuro para que el texto blanco sea legible.')
    return value.lower()

def png_file(f):
    """Accept PNG only. Validate chunks/CRC, dimensions and compressed stream without image dependencies."""
    if not f or f.size>2*1024*1024:
        raise ValueError('Selecciona un logo PNG de hasta 2 MB.')
    data=f.read(); f.seek(0)
    if not data.startswith(b'\x89PNG\r\n\x1a\n'):
        raise ValueError('El logo debe ser una imagen PNG. Exporta tu imagen en ese formato.')
    pos=8; first=True; compressed=bytearray(); ended=False
    while pos<len(data):
        if pos+12>len(data): raise ValueError('El PNG está incompleto.')
        length=struct.unpack('>I',data[pos:pos+4])[0]
        kind=data[pos+4:pos+8]; end=pos+8+length
        if end+4>len(data) or zlib.crc32(data[pos+4:end])&0xffffffff != struct.unpack('>I',data[end:end+4])[0]:
            raise ValueError('El PNG está dañado.')
        block=data[pos+8:end]
        if first:
            if kind!=b'IHDR' or length!=13: raise ValueError('Cabecera PNG inválida.')
            w,h,depth,mode,compression,filtering,interlace=struct.unpack('>IIBBBBB',block)
            if depth not in {0:(1,2,4,8,16),2:(8,16),3:(1,2,4,8),4:(8,16),6:(8,16)}.get(mode,()):
                raise ValueError('Profundidad de color PNG inválida.')
            if not 1<=w<=2048 or not 1<=h<=2048 or w*h>4_000_000 or depth not in (1,2,4,8,16) or mode not in (0,2,3,4,6) or compression or filtering or interlace not in (0,1):
                raise ValueError('Usa un logo PNG de hasta 2048 × 2048 píxeles.')
            first=False
        if kind==b'IDAT': compressed.extend(block)
        pos=end+4
        if kind==b'IEND':
            if length or pos!=len(data): raise ValueError('Final PNG inválido.')
            ended=True; break
    if not ended or not compressed: raise ValueError('El PNG no contiene una imagen completa.')
    try:
        channels={0:1,2:3,3:1,4:2,6:4}[mode]
        passes=[(0,0,1,1)] if not interlace else [(0,0,8,8),(4,0,8,8),(0,4,4,8),(2,0,4,4),(0,2,2,4),(1,0,2,2),(0,1,1,2)]
        rows=[]
        for x,y,dx,dy in passes:
            pw=max(0,(w-x+dx-1)//dx);ph=max(0,(h-y+dy-1)//dy)
            if pw and ph: rows.extend([1+(pw*channels*depth+7)//8]*ph)
        size=sum(rows)
        decoder=zlib.decompressobj(); decoded=decoder.decompress(compressed,size+1)
        if not decoder.eof or decoder.unused_data or len(decoded)!=size:
            raise ValueError('La imagen PNG no se puede leer.')
        offset=0
        for row in rows:
            if decoded[offset]>4: raise ValueError('La imagen PNG contiene filtros inválidos.')
            offset+=row
        if not decoded:
            raise ValueError('La imagen PNG no se puede leer.')
    except zlib.error:
        raise ValueError('La imagen PNG no se puede leer.')
    f.name='logo.png'
    return f

def admin_mutate(request,u,path,d):
    if path not in ADMIN_ACTIONS-{'user','user-edit','course','course-edit','membership'}:
        return False
    from .views import admin, text, boolean, integer, students
    admin(u)
    if path=='institution':
        i=institution()
        i.name=text(d,'name',120); i.short_name=text(d,'short_name',30)
        i.motto=text(d,'motto',200,False); i.year=text(d,'year',40)
        i.primary=color(d.get('primary'),True); i.secondary=color(d.get('secondary'))
        modules=d.get('modules',{})
        if not isinstance(modules,dict) or set(modules)!=set(CORE_LABELS)|set(MODULES):
            raise ValueError('Revisa la lista de módulos de la institución.')
        normalized={}
        for key, item in modules.items():
            if not isinstance(item,dict): raise ValueError('Configuración de módulo inválida.')
            enabled=boolean(item.get('enabled'))
            if key in CORE_LABELS and not enabled:
                raise ValueError('Inicio, aulas y actividades son apartados esenciales.')
            normalized[key]={'label':text(item,'label',35),'enabled':enabled}
        sections=d.get('sections',[])
        if not isinstance(sections,list) or len(sections)>6: raise ValueError('Puedes publicar hasta seis apartados de inicio.')
        clean=[]
        for section in sections:
            if not isinstance(section,dict): raise ValueError('Apartado inválido.')
            entry={'title':text(section,'title',80),'body':text(section,'body',500),'url':text(section,'url',500,False)}
            if entry['url']: URLValidator(schemes=['https','http'])(entry['url'])
            clean.append(entry)
        i.modules=normalized;i.sections=clean;i.save()
    elif path in ['institution-logo','institution-logo-delete']:
        i=institution(); previous=i.logo.name
        if path=='institution-logo': i.logo=png_file(request.FILES.get('file'))
        else: i.logo=''
        i.save()
        if previous and previous!=i.logo.name:
            storage=i.logo.storage
            transaction.on_commit(lambda:storage.delete(previous))
    elif path=='course-archive':
        c=Course.objects.get(id=integer(d.get('id'),1,2**63-1))
        c.archived=boolean(d.get('archived'));c.save(update_fields=['archived'])
    elif path=='teacher-assign':
        teacher=User.objects.get(id=integer(d.get('teacher'),1,2**63-1),profile__role='teacher',is_active=True)
        cs=selected_courses(d)
        Course.objects.filter(id__in=[c.id for c in cs]).update(teacher=teacher)
    elif path=='membership-bulk':
        cs=selected_courses(d); members=students(d)
        if not members: raise ValueError('Selecciona al menos un estudiante.')
        mode=d.get('mode')
        if mode not in ['add','remove','replace']: raise ValueError('Elige una operación de matrícula válida.')
        for c in cs:
            if mode=='add': c.students.add(*members)
            elif mode=='remove': c.students.remove(*members)
            else: c.students.set(members)
    elif path=='user-status':
        target=User.objects.get(id=integer(d.get('id'),1,2**63-1),profile__isnull=False)
        active=boolean(d.get('active'))
        if not active:
            if target.id==u.id: raise ValueError('No puedes desactivar tu propia cuenta.')
            if target.profile.role=='admin' and User.objects.filter(is_active=True,profile__role='admin').exclude(id=target.id).count()==0:
                raise ValueError('Debe permanecer al menos un administrador activo.')
            if target.profile.role=='teacher' and target.teaching.filter(archived=False).exists():
                raise ValueError('Reasigna sus materias activas antes de desactivar al profesor.')
        target.is_active=active;target.save(update_fields=['is_active'])
    elif path=='user-role':
        target=User.objects.select_related('profile').get(id=integer(d.get('id'),1,2**63-1))
        role=d.get('role')
        if role not in ['admin','teacher','student','guardian']: raise ValueError('Perfil inválido.')
        if target.profile.role != role:
            if target.id==u.id: raise ValueError('No puedes cambiar tu propio perfil administrativo.')
            if target.profile.role=='admin' and target.is_active and not User.objects.filter(is_active=True,profile__role='admin').exclude(id=target.id).exists():
                raise ValueError('Debe permanecer un administrador activo.')
            if target.profile.role=='teacher' and target.teaching.filter(archived=False).exists():
                raise ValueError('Reasigna sus materias activas antes de cambiar su perfil.')
            from .models import GuardianLink
            GuardianLink.objects.filter(Q(guardian=target)|Q(student=target)).update(active=False)
            target.profile.role=role;target.profile.save(update_fields=['role'])
    elif path=='user-details':
        target=User.objects.select_related('profile').get(id=integer(d.get('id'),1,2**63-1))
        p=target.profile
        p.phone=text(d,'phone',40,False);p.bio=text(d,'bio',1000,False)
        p.department=text(d,'department',100,False);p.identifier=text(d,'identifier',60,False)
        p.save(update_fields=['phone','bio','department','identifier'])
    return True

def log_change(u,path,d):
    names={'institution':'Identidad, apartados y módulos actualizados','institution-logo':'Logo institucional actualizado',
           'institution-logo-delete':'Logo institucional retirado','course':'Materia creada','course-edit':'Materia actualizada',
           'course-archive':'Estado de archivo de materia actualizado','user':'Cuenta creada','user-edit':'Cuenta actualizada',
           'user-role':'Perfil y permisos de cuenta actualizados','user-status':'Acceso de cuenta actualizado','user-details':'Ficha de persona actualizada',
           'teacher-assign':'Profesores reasignados','membership':'Matrícula de aula actualizada','membership-bulk':'Matrículas por lote actualizadas'}
    suffix=''
    if path in ['membership-bulk','teacher-assign']:
        suffix=f" · {len(set(d.get('courses',[])))} materias"
        if path=='membership-bulk': suffix+=f" · {len(set(d.get('students',[])))} estudiantes · {dict(add='añadir',remove='retirar',replace='reemplazar').get(d.get('mode'))}"
        else: suffix+=f" · profesor #{d.get('teacher')}"
    elif path in ['course-edit','course-archive','user-edit','user-status','user-details','user-role']:
        suffix=f" · registro #{d.get('id')}"
    AdministrationLog.objects.create(actor=u,actor_name=u.get_full_name() or u.username,action=path,summary=names[path]+suffix)

def logo_response(request):
    i=institution()
    if not i.logo: return HttpResponse(status=404)
    response=FileResponse(i.logo.open('rb'),content_type='image/png')
    response['X-Content-Type-Options']='nosniff'; response['Cache-Control']='public, max-age=3600'
    return response

def people_export():
    stream=io.StringIO(); writer=csv.writer(stream)
    writer.writerow(['Nombre','Correo','Perfil','Estado','Departamento','Identificador'])
    def safe(value):
        value=str(value)
        return "'"+value if value.lstrip().startswith(('=','+','-','@')) else value
    for u in User.objects.filter(profile__isnull=False).exclude(email__iendswith='@luma.demo').select_related('profile').order_by('id'):
        writer.writerow([safe(x) for x in [u.get_full_name() or u.username,u.email,u.profile.role,'Activo' if u.is_active else 'Inactivo',u.profile.department,u.profile.identifier]])
    response=HttpResponse('\ufeff'+stream.getvalue(),content_type='text/csv; charset=utf-8')
    response['Content-Disposition']='attachment; filename="Luma-personas.csv"'
    response['Cache-Control']='private, no-store'
    return response
