import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','campus.settings')
import django
django.setup()
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.models import User
from campus.models import *
if User.objects.exists():
    print('Base existente: los datos se conservan.')
    raise SystemExit
password='LumaDemo2026!'
def make(email,name,role,color):
    first,last=name.split(' ',1)
    u=User.objects.create_user(username=email,email=email,password=password,first_name=first,last_name=last)
    Profile.objects.create(user=u,role=role,color=color,bio='Aprendiendo, creando y creciendo en comunidad. ✨')
    return u
admin=make('admin@luma.demo','Valentina Solís','admin','purple')
teacher=make('profe@luma.demo','Lucía Fernández','teacher','green')
student=make('estudiante@luma.demo','Sofía Rivera','student','pink')
s2=make('mateo@luma.demo','Mateo Vargas','student','blue')
s3=make('emma@luma.demo','Emma Castro','student','peach')
today=timezone.localdate()
rows=[('Matemáticas','MAT-10','Encontramos patrones, resolvemos problemas y le damos sentido a los números.','purple','orbit','Lun · Mié · Vie / 08:00'),('Biología','BIO-10','Un pequeño laboratorio para descubrir la vida y cuidar nuestro planeta.','green','leaf','Mar · Jue / 09:30'),('Español y literatura','ESP-10','Historias que nos conectan. Lee, imagina y encuentra tu propia voz.','pink','flower','Lun · Mié / 10:15'),('Historia','HIS-10','Miramos al pasado para comprender el mundo que compartimos.','peach','sun','Mar · Vie / 11:00'),('Inglés','ING-10','New ideas, new words. A little more confident every day.','blue','star','Mar · Jue / 13:00'),('Arte y creatividad','ART-10','Un espacio para experimentar sin miedo y crear cosas maravillosas.','yellow','spark','Vie / 14:00')]
for i,(title,code,summary,color,symbol,schedule) in enumerate(rows):
    c=Course.objects.create(title=title,code=code,summary=summary,teacher=teacher,color=color,symbol=symbol,schedule=schedule)
    c.students.set([student,s2,s3])
    Post.objects.create(course=c,author=teacher,body='¡Bienvenidos a nuestra aula! Aquí compartiremos ideas, materiales y pequeños grandes descubrimientos. 💛')
    t=Task.objects.create(course=c,title=['El universo de las funciones','Bitácora de una célula','Una historia que vale la pena contar','Línea del tiempo: nuestra región','My dream adventure','Mi primer collage'][i],description='Explora el material de esta semana y comparte tu trabajo. Incluye tu proceso y una reflexión sobre lo que aprendiste. Puedes adjuntar un archivo o escribir tu respuesta.',due=today+timedelta(days=i+1),points=100)
    Resource.objects.create(course=c,title='Guía de estudio · Unidad 1',body='Objetivo: comprender los conceptos principales de la unidad.\n\n1. Revisa tus apuntes.\n2. Identifica tres ideas clave.\n3. Escribe un ejemplo de la vida cotidiana.\n4. Comparte tus preguntas en el muro del aula.')
    if i in [3,4]:Submission.objects.create(task=t,student=student,body='Mi reflexión y trabajo de la unidad.',grade=92 if i==3 else 96,feedback='¡Muy buen trabajo! Tus ejemplos son claros y creativos.')
    for offset in range(3):Attendance.objects.create(course=c,student=student,date=today-timedelta(days=offset+1),present=True)
Message.objects.create(sender=teacher,recipient=student,body='¡Hola, Sofi! Me encantó tu participación de hoy. Recuerda que puedes escribirme si tienes alguna duda con la actividad. 🌷')
Message.objects.create(sender=s2,recipient=student,body='¿Repasamos juntos para biología? Ya tengo mis apuntes listos 📚')
Message.objects.create(sender=admin,recipient=student,body='¡La feria creativa está cerca! Encuentra los detalles en el calendario del campus.')
for title,days,time,kind,desc in [('Club de lectura',1,'14:30','Comunidad','Trae tu libro favorito. Nos vemos en la biblioteca.'),('Feria creativa',4,'09:00','Campus','Un día para compartir proyectos, ideas y talento.'),('Encuentro con familias',7,'17:00','Familias','Conversemos sobre los avances de este trimestre.')]:Event.objects.create(title=title,date=today+timedelta(days=days),time=time,kind=kind,description=desc)
print('Campus de demostración creado. Cuentas: estudiante@luma.demo / profe@luma.demo / admin@luma.demo. Contraseña: LumaDemo2026!')
