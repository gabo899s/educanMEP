from django.urls import path
from . import views
urlpatterns=[path('',views.index),path('assets/<str:name>',views.asset),path('api/<path:path>',views.api)]
