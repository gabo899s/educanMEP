from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user=models.OneToOneField(User,on_delete=models.CASCADE)
    role=models.CharField(max_length=15,choices=[('admin','Administrador'),('teacher','Profesor'),('student','Estudiante')])
    bio=models.TextField(blank=True)
    phone=models.CharField(max_length=40,blank=True)
    color=models.CharField(max_length=20,default='pink')

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

class Post(models.Model):
    course=models.ForeignKey(Course,on_delete=models.CASCADE)
    author=models.ForeignKey(User,on_delete=models.CASCADE)
    body=models.TextField()
    created=models.DateTimeField(auto_now_add=True)

class Task(models.Model):
    course=models.ForeignKey(Course,on_delete=models.CASCADE)
    title=models.CharField(max_length=200)
    description=models.TextField()
    due=models.DateField()
    points=models.PositiveIntegerField(default=100)

class Submission(models.Model):
    task=models.ForeignKey(Task,on_delete=models.CASCADE)
    student=models.ForeignKey(User,on_delete=models.CASCADE)
    body=models.TextField(blank=True)
    file=models.FileField(upload_to='submissions/',blank=True)
    original_name=models.CharField(max_length=255,blank=True)
    grade=models.PositiveIntegerField(null=True,blank=True)
    feedback=models.TextField(blank=True)
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

class Attendance(models.Model):
    course=models.ForeignKey(Course,on_delete=models.CASCADE)
    student=models.ForeignKey(User,on_delete=models.CASCADE)
    date=models.DateField()
    present=models.BooleanField(default=True)
    class Meta:
        unique_together=[('course','student','date')]
