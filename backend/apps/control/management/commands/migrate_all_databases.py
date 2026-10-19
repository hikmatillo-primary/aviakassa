"""Barcha ro'yxatga olingan bazalarni (asosiy + dinamik/test) migratsiya qiladi.

Standart Django `migrate` faqat bitta bazani migratsiya qiladi. Ushbu buyruq
asosiy (default) baza bilan birga `DatabaseRegistry` dagi barcha faol va
yopilgan bazalarni ham eng so'nggi migratsiyalarga yangilaydi.
"""
from django.core.management import call_command
from django.core.management.base import BaseCommand

from apps.control.models import DatabaseRegistry
from apps.control.services import ensure_alias


class Command(BaseCommand):
    help = "Asosiy va barcha ro'yxatga olingan dinamik bazalarni migratsiya qiladi."

    def add_arguments(self, parser):
        parser.add_argument(
            "--fake", action="store_true",
            help="Migratsiyalarni o'tkazmasdan faqat yozuv qilib belgilash.",
        )

    def handle(self, *args, **options):
        fake = options.get("fake", False)

        # 1. Asosiy baza (default)
        self.stdout.write("Asosiy baza (default) migratsiya qilinmoqda...")
        call_command("migrate", database="default", interactive=False, fake=fake)
        self.stdout.write(self.style.SUCCESS("Asosiy baza muvaffaqiyatli migratsiya qilindi."))

        # 2. Ro'yxatdagi boshqa barcha bazalar
        try:
            registries = list(DatabaseRegistry.objects.using("default").all())
        except Exception as exc:
            self.stderr.write(f"Bazalar ro'yxatini o'qib bo'lmadi: {exc}")
            return

        for reg in registries:
            self.stdout.write(f"Baza migratsiya qilinmoqda: {reg.name} ({reg.db_name})...")
            try:
                alias = ensure_alias(reg.db_name)
                call_command("migrate", database=alias, interactive=False, fake=fake)
                self.stdout.write(
                    self.style.SUCCESS(f"Baza migratsiya qilindi: {reg.name} ({reg.db_name})")
                )
            except Exception as exc:
                self.stderr.write(
                    self.style.ERROR(f"Xato ({reg.name} - {reg.db_name}): {exc}")
                )
