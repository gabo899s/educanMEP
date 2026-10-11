"""Review drafts never overwrite student-visible published evaluations."""
from django.utils import timezone
from .models import GradeReview, Submission
from .teaching import rubric_assessment, short

class ReviewConflict(ValueError):
    pass

def check_revision(s,d):
    from .views import integer
    if ('version' in d and integer(d['version'],1,2**31-1)!=s.version or
        'review_revision' in d and integer(d['review_revision'],0,2**31-1)!=s.review_revision):
        raise ReviewConflict('La entrega o su evaluación cambió. Actualiza la página antes de revisar; tus comentarios siguen en el formulario.')

def apply_review(s,grade,feedback,assessment):
    from .teacher_workspace import save_version
    s.grade=grade;s.feedback=feedback;s.rubric_assessment=assessment
    s.reviewed_at=timezone.now();s.review_revision+=1
    s.save(update_fields=['grade','feedback','rubric_assessment','reviewed_at','review_revision'])
    save_version(s)
    GradeReview.objects.filter(submission=s).delete()

def mutate_review(u,path,d):
    from .views import staff,getcourse,integer,text
    if path!='grade' and path!='grade-publish' and not {'version','review_revision'} <= d.keys():
        raise ValueError('Actualiza la aplicación antes de guardar esta evaluación.')
    if path=='grade-publish':
        items=d.get('reviews')
        if not isinstance(items,list) or not 1<=len(items)<=50:
            raise ValueError('Selecciona entre una y 50 evaluaciones.')
        seen=set();records=[]
        for item in items:
            if not isinstance(item,dict) or not {'submission','version','review_revision'} <= item.keys():raise ValueError('Revisa las evaluaciones seleccionadas.')
            s=Submission.objects.select_related('task').get(pk=item['submission'])
            staff(u,getcourse(u,s.task.course_id));check_revision(s,item)
            if s.pk in seen:raise ValueError('No repitas una entrega.')
            seen.add(s.pk)
            review=GradeReview.objects.get(submission=s)
            if review.grade is None:raise ValueError('Completa todas las evaluaciones antes de publicarlas.')
            if s.returned or review.version!=s.version:raise ReviewConflict('Una entrega cambió. Actualiza antes de publicar.')
            records.append((s,review))
        for s,r in records:apply_review(s,r.grade,r.feedback,r.assessment)
        return
    s=Submission.objects.select_related('task').get(pk=d['submission'])
    staff(u,getcourse(u,s.task.course_id));check_revision(s,d)
    if s.returned:raise ValueError('Espera la nueva versión del estudiante antes de evaluar.')
    if path=='grade-discard':
        GradeReview.objects.filter(submission=s).delete()
        s.review_revision+=1;s.save(update_fields=['review_revision']);return
    if s.task.rubric:
        selections=d.get('rubric_selections');comments=d.get('criterion_feedback',{})
        criteria=s.task.rubric['criteria']
        if path=='grade-draft' and isinstance(selections,dict) and any(not selections.get(c['id']) for c in criteria):
            keys={c['id'] for c in criteria}
            if set(selections)-keys or not isinstance(comments,dict) or set(comments)-keys:
                raise ValueError('Revisa los criterios de evaluación.')
            chosen={};notes={};total=0;maximum=0
            for c in criteria:
                level=selections.get(c['id'])
                if level:
                    match=next((l for l in c['levels'] if l['id']==level),None)
                    if match is None:raise ValueError('Selecciona un nivel válido de la rúbrica.')
                    chosen[c['id']]=level;total+=match['points']
                maximum+=max(l['points'] for l in c['levels'])
                notes[c['id']]=short(comments.get(c['id'],''),'el comentario del criterio',1000,False)
            grade=None;assessment={'selections':chosen,'feedback':notes,'total':total,'maximum':maximum,'grade':None,'complete':False}
        else:
            assessment=rubric_assessment(s.task.rubric,selections,comments,s.task.points)
            grade=assessment['grade']
    else:
        assessment={};grade=None if path=='grade-draft' and d.get('grade') in [None,''] else integer(d['grade'],0,s.task.points)
    feedback=text(d,'feedback',2000,False)
    if path=='grade-draft':
        GradeReview.objects.update_or_create(submission=s,defaults={'author':u,'version':s.version,'grade':grade,'feedback':feedback,'assessment':assessment})
        s.review_revision+=1;s.save(update_fields=['review_revision'])
    else:apply_review(s,grade,feedback,assessment)

def review_state(u,course_ids):
    if u.profile.role not in ['teacher','admin']:return {}
    return {r.submission_id:{'grade':r.grade,'feedback':r.feedback,'rubric_assessment':r.assessment,'version':r.version,'author':r.author_id,'updated':r.updated.isoformat()}
            for r in GradeReview.objects.filter(submission__task__course_id__in=course_ids)}
