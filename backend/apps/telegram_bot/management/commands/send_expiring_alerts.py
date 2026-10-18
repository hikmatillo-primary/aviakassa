"""Muddati yaqin chiptalar bo'yicha Telegram guruhlarga avtomatik xabarnoma jo'natish."""
from django.core.management.base import BaseCommand

from apps.telegram_bot import services
from core.db_state import reset_active_alias, set_active_alias


class Command(BaseCommand):
    help = "Muddati yaqin chiptalar bo'yicha admin guruhlarga va ruxsatli chatlarga avto-xabarnoma jo'natadi"

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=2,
            help="Necha kun ichida uchadigan partiyalarni ogohlantirish kerak (standart: 2)",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Partiya bo'lmasa ham xabar yuborish",
        )

    def handle(self, *args, **options):
        days = options["days"]
        force = options["force"]

        # Faol bazani aniqlash
        token = None
        try:
            from apps.control.services import resolve_active_alias
            token = set_active_alias(resolve_active_alias())
        except Exception:
            token = None

        try:
            upcoming, overdue = services.get_expiring_batches(days)
            if not upcoming and not overdue and not force:
                self.stdout.write("Muddati yaqin yoki o'tgan partiyalar yo'q, xabar yuborilmadi.")
                return

            text = services.expiring_reply_text(days)
            groups = services.get_admin_groups()

            if not groups:
                self.stdout.write("Admin guruhlar topilmadi. Botni guruhga qo'shib admin qiling.")
                return

            sent_count = 0
            for group in groups:
                try:
                    services.send_message(group.chat_id, text)
                    sent_count += 1
                    self.stdout.write(self.style.SUCCESS(f"Yuborildi: {group.title or group.chat_id}"))
                except Exception as exc:  # noqa: BLE001
                    self.stderr.write(f"Xato ({group.chat_id}): {exc}")

            self.stdout.write(self.style.SUCCESS(f"Jami {sent_count} ta guruhga xabarnoma yuborildi."))
        finally:
            if token is not None:
                reset_active_alias(token)
