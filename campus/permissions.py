"""Política central de perfiles. El alcance de cada aula se verifica en views."""
COMMON = {'profile.edit', 'appearance.edit', 'messages.use', 'wall.participate', 'courses.favorite'}
ROLE_PERMISSIONS = {
    'student': COMMON | {'assignments.submit', 'learning.manage', 'help.ask', 'ai.study'},
    'teacher': COMMON | {'assignments.manage', 'grades.manage', 'materials.manage', 'attendance.manage', 'events.manage', 'teaching.customize', 'help.respond', 'portfolio.review'},
    'admin': COMMON | {'assignments.manage', 'grades.manage', 'materials.manage', 'attendance.manage', 'events.manage', 'courses.manage', 'users.manage', 'membership.manage', 'teaching.customize', 'institution.manage'},
}
ACTION_PERMISSIONS = {
    'ai-study':'ai.study',
    **{k: 'learning.manage' for k in ['planner','planner-edit','planner-toggle','planner-delete','goal','goal-edit','goal-progress','goal-delete','note','note-edit','note-pin','note-delete','portfolio','portfolio-edit','portfolio-delete','student-settings','feedback-read']},
    'help-ask':'help.ask','help-reply':'messages.use','help-status':'help.ask','course-timetable':'assignments.manage',
    'institution': 'institution.manage', 'institution-logo': 'institution.manage', 'institution-logo-delete': 'institution.manage',
    'user-role': 'users.manage', 'user-status': 'users.manage', 'user-details': 'users.manage', 'course-archive': 'courses.manage',
    'teacher-assign': 'courses.manage', 'membership-bulk': 'membership.manage',
    'teaching-preferences': 'teaching.customize', 'teaching-template': 'teaching.customize', 'teaching-template-edit': 'teaching.customize', 'teaching-template-delete': 'teaching.customize',
    'profile': 'profile.edit', 'password': 'profile.edit', 'appearance': 'appearance.edit',
    'favorite': 'courses.favorite', 'message': 'messages.use', 'read': 'messages.use',
    'post': 'wall.participate', 'post-edit': 'wall.participate', 'post-delete': 'wall.participate',
    'post-pin': 'assignments.manage', 'task': 'assignments.manage', 'task-edit': 'assignments.manage', 'task-toggle': 'assignments.manage',
    'submit': 'assignments.submit', 'draft': 'assignments.submit', 'grade': 'grades.manage',
    'course': 'courses.manage', 'course-edit': 'courses.manage', 'user': 'users.manage', 'user-edit': 'users.manage',
    'membership': 'membership.manage', 'event': 'events.manage', 'event-edit': 'events.manage', 'event-delete': 'events.manage',
    'resource': 'materials.manage', 'resource-edit': 'materials.manage', 'resource-delete': 'materials.manage', 'attendance': 'attendance.manage',
}

def permissions(user):
    return sorted(ROLE_PERMISSIONS.get(user.profile.role, set()))

def authorize(user, action):
    capability = ACTION_PERMISSIONS.get(action)
    if capability is None or capability not in ROLE_PERMISSIONS.get(user.profile.role, set()):
        raise PermissionError('Tu perfil no tiene permiso para realizar esta acción.')
