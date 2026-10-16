import os
import secrets

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.partners.models import Partner
from apps.flights.models import Batch
from apps.sales.models import Sale
from apps.cash.models import Payment, DebtOffset

class Command(BaseCommand):
    help = "Barcha demo ma'lumotlarni tozalaydi va admin parolini yangilaydi (ADMIN_PASSWORD env orqali)"

    def handle(self, *args, **options):
        self.stdout.write("Demo ma'lumotlar tozalanmoqda...")
        DebtOffset.objects.all().delete()
        Payment.objects.all().delete()
        Sale.objects.all().delete()
        Batch.objects.all().delete()
        Partner.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("Barcha demo ma'lumotlar muvaffaqiyatli o'chirildi!"))

        password = os.environ.get("ADMIN_PASSWORD") or os.environ.get("DJANGO_SUPERUSER_PASSWORD")
        generated = False
        if not password:
            password = secrets.token_urlsafe(12)
            generated = True

        User = get_user_model()
        user, created = User.objects.get_or_create(username="admin", defaults={"email": "admin@aviakassa.uz"})
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.save()

        self.stdout.write(self.style.SUCCESS("Admin yangilandi: Login: admin"))
        if generated:
            self.stdout.write(self.style.WARNING(
                f"ADMIN_PASSWORD berilmagan — generatsiya qilingan parol: {password}\n"
                "Iltimos, bu parolni xavfsiz joyda saqlang."
            ))
