import os
import secrets

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Boshlang'ich admin (superuser) yaratish"

    def handle(self, *args, **options):
        User = get_user_model()
        username = os.environ.get("DJANGO_ADMIN_USERNAME", "admin")
        email = os.environ.get("DJANGO_ADMIN_EMAIL", "admin@aviakassa.uz")
        # Parol DJANGO_ADMIN_PASSWORD orqali beriladi; bo'lmasa kuchli tasodifiy parol.
        password = os.environ.get("DJANGO_ADMIN_PASSWORD") or secrets.token_urlsafe(12)

        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username=username, email=email, password=password)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Admin yaratildi! Login: {username}, Parol: {password}"
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(f"'{username}' foydalanuvchisi allaqachon mavjud.")
            )
