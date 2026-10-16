from django.urls import path

from . import views

urlpatterns = [
    path("", views.databases, name="databases"),
    path("<int:pk>/activate/", views.activate_database, name="database-activate"),
    path("<int:pk>/close/", views.close_database, name="database-close"),
]
