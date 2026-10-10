from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user=models.OneToOneField(User,on_delete=models.CASCADE)
    role=models.CharField(max_length=15,choices=[('admin','Administrador'),('teacher','Profesor'),('student','Estudiante')])
    bio=models.TextField(blank=True)
    phone=models.CharField(max_length=40,blank=True)
    color=models.CharField(max_length=20,default='pink')
    preferences=models.JSONField(default=dict,blank=True)
    department=models.CharField(max_length=100,blank=True)
    identifier=models.CharField(max_length=60,blank=True)

# Adapted from adilmohak/django-lms Course and CourseAllocation (MIT).
# College-focused title/code/summary retained; school membership replaces programs/semesters.
class Course(models.Model):
    title=models.CharField(max_length=200)
    code=models.CharField(max_length=200,unique=True)
    summary=models.TextField(max_length=200,blank=True)
    teacher=models.ForeignKey(User,on_delete=models.PROTECT,related_name='teaching')
    students=models.ManyToManyField(User,related_name='courses',blank=True)
    color=models.CharField(max_length=20,default='pink')
    symbol=models.CharField(max_length=20,default='flower')
    schedule=models.CharField(max_length=100,blank=True)
    room=models.CharField(max_length=60,default='10-A')
    archived=models.BooleanField(default=False)

class Post(models.Model):
    course=models.ForeignKey(Course,on_delete=models.CASCADE)
    author=models.ForeignKey(User,on_delete=models.CASCADE)
    body=models.TextField()
    created=models.DateTimeField(auto_now_add=True)
    pinned=models.BooleanField(default=False)

class Task(models.Model):
    course=models.ForeignKey(Course,on_delete=models.CASCADE)
    title=models.CharField(max_length=200)
    description=models.TextField()
    due=models.DateField()
    points=models.PositiveIntegerField(default=100)
    closed=models.BooleanField(default=False)
    kind=models.CharField(max_length=20,default='assignment')
    submission_mode=models.CharField(max_length=10,default='both')
    allow_late=models.BooleanField(default=True)
    color=models.CharField(max_length=20,default='purple')
    rubric=models.JSONField(default=dict,blank=True)
    fields=models.JSONField(default=list,blank=True)

class Submission(models.Model):
    task=models.ForeignKey(Task,on_delete=models.CASCADE)
    student=models.ForeignKey(User,on_delete=models.CASCADE)
    body=models.TextField(blank=True)
    file=models.FileField(upload_to='submissions/',blank=True)
    original_name=models.CharField(max_length=255,blank=True)
    grade=models.PositiveIntegerField(null=True,blank=True)
    feedback=models.TextField(blank=True)
    answers=models.JSONField(default=dict,blank=True)
    rubric_assessment=models.JSONField(default=dict,blank=True)
    created=models.DateTimeField(auto_now=True)
    class Meta:
        unique_together=[('task','student')]

class Message(models.Model):
    sender=models.ForeignKey(User,on_delete=models.CASCADE,related_name='sent_messages')
    recipient=models.ForeignKey(User,on_delete=models.CASCADE,related_name='received_messages')
    body=models.TextField()
    created=models.DateTimeField(auto_now_add=True)
    read=models.BooleanField(default=False)

class Event(models.Model):
    author=models.ForeignKey(User,on_delete=models.SET_NULL,null=True,blank=True,related_name='campus_events')
    title=models.CharField(max_length=200)
    date=models.DateField()
    time=models.CharField(max_length=30)
    kind=models.CharField(max_length=30,default='Campus')
    description=models.TextField(blank=True)

class Resource(models.Model):
    course=models.ForeignKey(Course,on_delete=models.CASCADE)
    title=models.CharField(max_length=200)
    url=models.URLField(blank=True)
    body=models.TextField(blank=True)
    file=models.FileField(upload_to='materials/',blank=True)
    original_name=models.CharField(max_length=255,blank=True)

class Attendance(models.Model):
    course=models.ForeignKey(Course,on_delete=models.CASCADE)
    student=models.ForeignKey(User,on_delete=models.CASCADE)
    date=models.DateField()
    present=models.BooleanField(default=True)
    class Meta:
        unique_together=[('course','student','date')]

class Draft(models.Model):
    task=models.ForeignKey(Task,on_delete=models.CASCADE)
    student=models.ForeignKey(User,on_delete=models.CASCADE)
    body=models.TextField(blank=True)
    updated=models.DateTimeField(auto_now=True)
    answers=models.JSONField(default=dict,blank=True)
    class Meta:
        unique_together=[('task','student')]

class TeachingTemplate(models.Model):
    author=models.ForeignKey(User,on_delete=models.CASCADE,related_name='teaching_templates')
    kind=models.CharField(max_length=10,choices=[('rubric','Rúbrica'),('fields','Campos')])
    title=models.CharField(max_length=120)
    definition=models.JSONField(default=dict)
    updated=models.DateTimeField(auto_now=True)

class Institution(models.Model):
    name=models.CharField(max_length=120,default='Colegio Las Jacarandas')
    short_name=models.CharField(max_length=30,default='luma')
    motto=models.CharField(max_length=200,default='Un lugar para aprender y florecer.')
    year=models.CharField(max_length=40,default='2026')
    primary=models.CharField(max_length=7,default='#70547e')
    secondary=models.CharField(max_length=7,default='#f0e5f1')
    logo=models.FileField(upload_to='institution/',blank=True)
    modules=models.JSONField(default=dict,blank=True)
    sections=models.JSONField(default=list,blank=True)
    updated=models.DateTimeField(auto_now=True)

class AdministrationLog(models.Model):
    actor=models.ForeignKey(User,on_delete=models.SET_NULL,null=True)
    actor_name=models.CharField(max_length=150)
    action=models.CharField(max_length=50)
    summary=models.CharField(max_length=250)
    created=models.DateTimeField(auto_now_add=True)
