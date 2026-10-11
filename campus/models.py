from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user=models.OneToOneField(User,on_delete=models.CASCADE)
    role=models.CharField(max_length=15,choices=[('admin','Administrador'),('teacher','Profesor'),('student','Estudiante'),('guardian','Familiar / encargado')])
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
    timetable=models.JSONField(default=list,blank=True)

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

    publication=models.CharField(max_length=12,default='published')
    publish_at=models.DateTimeField(null=True,blank=True)
    competencies=models.JSONField(default=list,blank=True)

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
    reviewed_at=models.DateTimeField(null=True,blank=True)
    created=models.DateTimeField(auto_now=True)
    class Meta:
        unique_together=[('task','student')]

    returned=models.BooleanField(default=False)
    return_message=models.TextField(blank=True)
    version=models.PositiveIntegerField(default=1)

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
    name=models.CharField(max_length=120,default='Mi institución')
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

class PlannerEntry(models.Model):
    student=models.ForeignKey(User,on_delete=models.CASCADE,related_name='planner_entries')
    course=models.ForeignKey(Course,on_delete=models.SET_NULL,null=True,blank=True)
    task=models.ForeignKey(Task,on_delete=models.SET_NULL,null=True,blank=True)
    title=models.CharField(max_length=160)
    kind=models.CharField(max_length=12,default='personal')
    date=models.DateField()
    time=models.CharField(max_length=5,blank=True)
    duration=models.PositiveIntegerField(default=30)
    priority=models.CharField(max_length=8,default='normal')
    remind_minutes=models.PositiveIntegerField(default=60)
    notes=models.TextField(blank=True)
    completed=models.BooleanField(default=False)
    updated=models.DateTimeField(auto_now=True)

class LearningGoal(models.Model):
    student=models.ForeignKey(User,on_delete=models.CASCADE,related_name='learning_goals')
    course=models.ForeignKey(Course,on_delete=models.SET_NULL,null=True,blank=True)
    title=models.CharField(max_length=160)
    due=models.DateField()
    target=models.PositiveIntegerField(default=5)
    progress=models.PositiveIntegerField(default=0)
    unit=models.CharField(max_length=30,default='pasos')
    reflection=models.TextField(blank=True)
    updated=models.DateTimeField(auto_now=True)

class StudentNote(models.Model):
    student=models.ForeignKey(User,on_delete=models.CASCADE,related_name='student_notes')
    course=models.ForeignKey(Course,on_delete=models.SET_NULL,null=True,blank=True)
    title=models.CharField(max_length=160)
    body=models.TextField()
    tags=models.JSONField(default=list,blank=True)
    pinned=models.BooleanField(default=False)
    updated=models.DateTimeField(auto_now=True)

class PortfolioEntry(models.Model):
    student=models.ForeignKey(User,on_delete=models.CASCADE,related_name='portfolio_entries')
    course=models.ForeignKey(Course,on_delete=models.SET_NULL,null=True,blank=True)
    submission=models.ForeignKey(Submission,on_delete=models.SET_NULL,null=True,blank=True)
    title=models.CharField(max_length=160)
    reflection=models.TextField(blank=True)
    tags=models.JSONField(default=list,blank=True)
    sharing=models.CharField(max_length=10,default='private')
    artifact=models.JSONField(default=dict,blank=True)
    file=models.FileField(upload_to='portfolio/',blank=True)
    original_name=models.CharField(max_length=255,blank=True)
    updated=models.DateTimeField(auto_now=True)

class HelpRequest(models.Model):
    student=models.ForeignKey(User,on_delete=models.CASCADE,related_name='help_requests')
    task=models.ForeignKey(Task,on_delete=models.CASCADE,related_name='help_requests')
    question=models.TextField()
    status=models.CharField(max_length=10,default='open')
    file=models.FileField(upload_to='help/',blank=True)
    original_name=models.CharField(max_length=255,blank=True)
    created=models.DateTimeField(auto_now_add=True)
    updated=models.DateTimeField(auto_now=True)

class HelpReply(models.Model):
    request=models.ForeignKey(HelpRequest,on_delete=models.CASCADE,related_name='replies')
    author=models.ForeignKey(User,on_delete=models.PROTECT)
    body=models.TextField()
    created=models.DateTimeField(auto_now_add=True)

class FeedbackReceipt(models.Model):
    submission=models.OneToOneField(Submission,on_delete=models.CASCADE,related_name='feedback_receipt')
    fingerprint=models.CharField(max_length=64)
    updated=models.DateTimeField(auto_now=True)

class AIStudySession(models.Model):
    student=models.ForeignKey(User,on_delete=models.CASCADE,related_name='ai_studies')
    course=models.ForeignKey(Course,on_delete=models.SET_NULL,null=True,blank=True)
    title=models.CharField(max_length=160)
    tutor_mode=models.BooleanField(default=False)
    busy_until=models.DateTimeField(null=True,blank=True)
    created=models.DateTimeField(auto_now_add=True)
    updated=models.DateTimeField(auto_now=True)

class AIStudySource(models.Model):
    session=models.ForeignKey(AIStudySession,on_delete=models.CASCADE,related_name='sources')
    kind=models.CharField(max_length=16)
    title=models.CharField(max_length=180)
    content=models.TextField(blank=True)
    url=models.URLField(max_length=1000,blank=True)
    file=models.FileField(upload_to='ai-study/',blank=True)
    original_name=models.CharField(max_length=255,blank=True)
    status=models.CharField(max_length=20,default='ready')
    notice=models.CharField(max_length=500,blank=True)
    assignment=models.BooleanField(default=False)
    origin=models.JSONField(default=dict,blank=True)
    created=models.DateTimeField(auto_now_add=True)

class AIStudyTurn(models.Model):
    session=models.ForeignKey(AIStudySession,on_delete=models.CASCADE,related_name='turns')
    request_id=models.UUIDField()
    question=models.TextField()
    answer=models.TextField(blank=True)
    sources=models.JSONField(default=list,blank=True)
    citations=models.JSONField(default=list,blank=True)
    mode=models.CharField(max_length=12,default='study')
    status=models.CharField(max_length=12,default='pending')
    error=models.CharField(max_length=300,blank=True)
    created=models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints=[models.UniqueConstraint(fields=['session','request_id'],name='ai_unique_request')]


class LessonPlan(models.Model):
    author=models.ForeignKey(User,on_delete=models.CASCADE)
    course=models.ForeignKey(Course,on_delete=models.CASCADE)
    title=models.CharField(max_length=160)
    date=models.DateField()
    duration=models.PositiveIntegerField(default=60)
    objectives=models.TextField()
    content=models.TextField(blank=True)
    materials=models.TextField(blank=True)
    activities=models.TextField(blank=True)
    reflection=models.TextField(blank=True)
    updated=models.DateTimeField(auto_now=True)

class TeachingLibraryItem(models.Model):
    author=models.ForeignKey(User,on_delete=models.CASCADE)
    title=models.CharField(max_length=200)
    folder=models.CharField(max_length=100,blank=True)
    tags=models.JSONField(default=list,blank=True)
    kind=models.CharField(max_length=12,default='resource')
    definition=models.JSONField(default=dict)
    file=models.FileField(upload_to='teaching-library/',blank=True)
    original_name=models.CharField(max_length=255,blank=True)
    updated=models.DateTimeField(auto_now=True)

class Competency(models.Model):
    course=models.ForeignKey(Course,on_delete=models.CASCADE)
    title=models.CharField(max_length=160)
    description=models.TextField(blank=True)
    target=models.PositiveIntegerField(default=70)

class TaskAdaptation(models.Model):
    task=models.ForeignKey(Task,on_delete=models.CASCADE)
    student=models.ForeignKey(User,on_delete=models.CASCADE)
    due=models.DateField(null=True,blank=True)
    instructions=models.TextField(blank=True)
    private_notes=models.TextField(blank=True)
    class Meta:
        constraints=[models.UniqueConstraint(fields=['task','student'],name='unique_task_adaptation')]

class SubmissionVersion(models.Model):
    submission=models.ForeignKey(Submission,on_delete=models.CASCADE,related_name='versions')
    number=models.PositiveIntegerField()
    body=models.TextField(blank=True)
    answers=models.JSONField(default=dict)
    file=models.FileField(upload_to='submission-versions/',blank=True)
    original_name=models.CharField(max_length=255,blank=True)
    grade=models.PositiveIntegerField(null=True,blank=True)
    feedback=models.TextField(blank=True)
    rubric_assessment=models.JSONField(default=dict)
    created=models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints=[models.UniqueConstraint(fields=['submission','number'],name='unique_submission_version')]

    return_message=models.TextField(blank=True)

class TutoringSlot(models.Model):
    teacher=models.ForeignKey(User,on_delete=models.CASCADE)
    course=models.ForeignKey(Course,on_delete=models.CASCADE)
    starts=models.DateTimeField()
    minutes=models.PositiveIntegerField(default=30)
    location=models.CharField(max_length=160)
    student=models.ForeignKey(User,on_delete=models.SET_NULL,null=True,blank=True,related_name='tutoring_bookings')
    question=models.TextField(blank=True)
    agreement=models.TextField(blank=True)
    cancelled=models.BooleanField(default=False)

class TeacherAIDraft(models.Model):
    author=models.ForeignKey(User,on_delete=models.CASCADE)
    course=models.ForeignKey(Course,on_delete=models.SET_NULL,null=True,blank=True)
    kind=models.CharField(max_length=12)
    title=models.CharField(max_length=160)
    prompt=models.TextField()
    content=models.TextField()
    status=models.CharField(max_length=12,default='draft')
    created=models.DateTimeField(auto_now_add=True)

# Family records are deliberately separate from personal student notebooks and AI.
class GuardianLink(models.Model):
    guardian=models.ForeignKey(User,on_delete=models.CASCADE,related_name='family_links')
    student=models.ForeignKey(User,on_delete=models.CASCADE,related_name='guardian_links')
    relationship=models.CharField(max_length=60,default='Encargado')
    academic=models.BooleanField(default=True)
    active=models.BooleanField(default=True)
    verified_by=models.ForeignKey(User,on_delete=models.SET_NULL,null=True,related_name='+')
    verified_at=models.DateTimeField(auto_now=True)
    class Meta:
        constraints=[models.UniqueConstraint(fields=['guardian','student'],name='unique_guardian_student')]

class FamilyPublication(models.Model):
    delivery_prepared=models.BooleanField(default=False)
    translations=models.JSONField(default=dict,blank=True)
    author=models.ForeignKey(User,on_delete=models.PROTECT,related_name="+")
    course=models.ForeignKey(Course,on_delete=models.PROTECT,null=True,blank=True)
    kind=models.CharField(max_length=20,default='announcement')
    title=models.CharField(max_length=160)
    body=models.TextField()
    fields=models.JSONField(default=list,blank=True)
    publish_at=models.DateTimeField()
    deadline=models.DateTimeField(null=True,blank=True)
    acknowledgement=models.BooleanField(default=False)
    urgent=models.BooleanField(default=False)
    capacity=models.PositiveIntegerField(default=0)
    location=models.CharField(max_length=200,blank=True)
    event_at=models.DateTimeField(null=True,blank=True)
    file=models.FileField(upload_to='family/publications/',blank=True)
    original_name=models.CharField(max_length=255,blank=True)
    cancelled=models.BooleanField(default=False)
    created=models.DateTimeField(auto_now_add=True)

class FamilyReceipt(models.Model):
    publication=models.ForeignKey(FamilyPublication,on_delete=models.CASCADE,related_name='receipts')
    guardian=models.ForeignKey(User,on_delete=models.CASCADE,related_name="+")
    student=models.ForeignKey(User,on_delete=models.CASCADE,related_name="+")
    read_at=models.DateTimeField(null=True,blank=True)
    confirmed_at=models.DateTimeField(null=True,blank=True)
    response=models.CharField(max_length=20,blank=True)
    answers=models.JSONField(default=dict,blank=True)
    signature=models.CharField(max_length=100,blank=True)
    responded_at=models.DateTimeField(null=True,blank=True)
    class Meta:
        constraints=[models.UniqueConstraint(fields=['publication','guardian','student'],name='unique_family_receipt')]

class FamilyConversation(models.Model):
    guardian=models.ForeignKey(User,on_delete=models.PROTECT,related_name='family_conversations')
    student=models.ForeignKey(User,on_delete=models.PROTECT,related_name="+")
    staff=models.ForeignKey(User,on_delete=models.PROTECT,related_name='family_staff_conversations')
    subject=models.CharField(max_length=160)
    category=models.CharField(max_length=20,default='academic')
    closed=models.BooleanField(default=False)
    updated=models.DateTimeField(auto_now=True)

class FamilyReply(models.Model):
    conversation=models.ForeignKey(FamilyConversation,on_delete=models.CASCADE,related_name='replies')
    author=models.ForeignKey(User,on_delete=models.PROTECT,related_name="+")
    body=models.TextField()
    file=models.FileField(upload_to='family/messages/',blank=True)
    original_name=models.CharField(max_length=255,blank=True)
    read_at=models.DateTimeField(null=True,blank=True)
    created=models.DateTimeField(auto_now_add=True)

class AbsenceJustification(models.Model):
    attendance=models.OneToOneField(Attendance,on_delete=models.CASCADE,related_name='justification')
    guardian=models.ForeignKey(User,on_delete=models.PROTECT,related_name="+")
    kind=models.CharField(max_length=20,default='absence')
    reason=models.TextField()
    status=models.CharField(max_length=20,default='received')
    review=models.TextField(blank=True)
    reviewer=models.ForeignKey(User,on_delete=models.SET_NULL,null=True,related_name='+')
    file=models.FileField(upload_to='family/absence/',blank=True)
    original_name=models.CharField(max_length=255,blank=True)
    updated=models.DateTimeField(auto_now=True)

class FamilyAppointment(models.Model):
    staff=models.ForeignKey(User,on_delete=models.PROTECT,related_name='family_appointments')
    course=models.ForeignKey(Course,on_delete=models.PROTECT,null=True,blank=True)
    starts=models.DateTimeField()
    minutes=models.PositiveIntegerField(default=30)
    location=models.CharField(max_length=200)
    guardian=models.ForeignKey(User,on_delete=models.PROTECT,null=True,blank=True,related_name='booked_family_appointments')
    student=models.ForeignKey(User,on_delete=models.PROTECT,null=True,blank=True)
    question=models.TextField(blank=True)
    agreement=models.TextField(blank=True)
    cancelled=models.BooleanField(default=False)

class FamilyRequest(models.Model):
    guardian=models.ForeignKey(User,on_delete=models.PROTECT,related_name="+")
    student=models.ForeignKey(User,on_delete=models.PROTECT,related_name="+")
    kind=models.CharField(max_length=30,default='certificate')
    title=models.CharField(max_length=160)
    body=models.TextField()
    status=models.CharField(max_length=20,default='received')
    responsible=models.ForeignKey(User,on_delete=models.SET_NULL,null=True,blank=True,related_name='+')
    file=models.FileField(upload_to='family/requests/',blank=True)
    original_name=models.CharField(max_length=255,blank=True)
    created=models.DateTimeField(auto_now_add=True)
    updated=models.DateTimeField(auto_now=True)

class FamilyRequestUpdate(models.Model):
    request=models.ForeignKey(FamilyRequest,on_delete=models.CASCADE,related_name='history')
    author=models.ForeignKey(User,on_delete=models.PROTECT,related_name="+")
    status=models.CharField(max_length=20)
    body=models.TextField()
    file=models.FileField(upload_to='family/request-updates/',blank=True)
    original_name=models.CharField(max_length=255,blank=True)
    created=models.DateTimeField(auto_now_add=True)

class FamilySupportPlan(models.Model):
    author=models.ForeignKey(User,on_delete=models.PROTECT,related_name="+")
    student=models.ForeignKey(User,on_delete=models.PROTECT,related_name="+")
    course=models.ForeignKey(Course,on_delete=models.PROTECT)
    title=models.CharField(max_length=160)
    evidence=models.TextField()
    agreement=models.TextField()
    follow_up=models.DateField()
    shared=models.BooleanField(default=False)
    status=models.CharField(max_length=20,default='open')
    updated=models.DateTimeField(auto_now=True)

class FamilyDelivery(models.Model):
    guardian=models.ForeignKey(User,on_delete=models.CASCADE,related_name="+")
    publication=models.ForeignKey(FamilyPublication,on_delete=models.CASCADE,null=True,blank=True)
    key=models.CharField(max_length=200,unique=True)
    channel=models.CharField(max_length=15)
    title=models.CharField(max_length=200)
    body=models.TextField()
    urgent=models.BooleanField(default=False)
    due=models.DateTimeField()
    status=models.CharField(max_length=20,default='pending')
    attempts=models.PositiveIntegerField(default=0)
    error=models.CharField(max_length=300,blank=True)
    sent_at=models.DateTimeField(null=True,blank=True)
    claimed_at=models.DateTimeField(null=True,blank=True)

class FamilyPushSubscription(models.Model):
    guardian=models.ForeignKey(User,on_delete=models.CASCADE,related_name="+")
    endpoint=models.URLField(max_length=1000,unique=True)
    keys=models.JSONField(default=dict)
    updated=models.DateTimeField(auto_now=True)

class FamilyCommunicationDraft(models.Model):
    publication=models.ForeignKey(FamilyPublication,on_delete=models.SET_NULL,null=True,blank=True)
    language=models.CharField(max_length=5,default="es")
    author=models.ForeignKey(User,on_delete=models.CASCADE,related_name="+")
    title=models.CharField(max_length=160)
    content=models.TextField()
    created=models.DateTimeField(auto_now_add=True)
