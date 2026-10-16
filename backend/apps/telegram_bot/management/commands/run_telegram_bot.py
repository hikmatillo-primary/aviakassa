"""Telegram botni long-polling rejimida ishga tushiruvchi management command."""
import signal
import time

from django.core.management.base import BaseCommand, CommandError

from apps.telegram_bot import services

COMMANDS_MENU = [
    {"command": "muddati", "description": "Muddati yaqin chiptalar ro'yxati"},
    {"command": "help", "description": "Yordam"},
]


class Command(BaseCommand):
    help = "Telegram botni long-polling rejimida ishga tushiradi (chiqish: Ctrl+C yoki SIGTERM)"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._running = True

    def _stop(self, *args):
        self._running = False
        self.stdout.write("To'xtatish signali olindi, jarayon tugatilmoqda...")

    def handle(self, *args, **options):
        if not services.get_token():
            raise CommandError("TELEGRAM_BOT_TOKEN o'rnatilmagan!")

        signal.signal(signal.SIGTERM, self._stop)
        signal.signal(signal.SIGINT, self._stop)

        try:
            services.api_call("deleteWebhook", {"drop_pending_updates": False}, timeout=15)
            services.api_call("setMyCommands", {"commands": COMMANDS_MENU}, timeout=15)
        except Exception as exc:  # noqa: BLE001
            self.stderr.write(f"Boshlang'ich sozlashda xato: {exc}")

        days = services.get_default_days()
        self.stdout.write(self.style.SUCCESS(
            f"Telegram bot ishga tushdi (long polling, ogohlantirish muddati: {days} kun)"
        ))

        offset = 0
        while self._running:
            try:
                updates = services.poll_updates(offset)
            except Exception as exc:  # noqa: BLE001
                self.stderr.write(f"getUpdates xatosi: {exc}")
                time.sleep(3)
                continue

            for update in updates:
                offset = update.get("update_id", offset) + 1
                self._handle_update(update)

        self.stdout.write("Bot to'xtatildi.")

    def _handle_update(self, update):
        message = update.get("message") or {}
        chat = message.get("chat") or {}
        chat_id = chat.get("id")
        text = message.get("text")
        if chat_id is None or not text:
            return

        allowed = services.get_allowed_chat_ids()
        if allowed and chat_id not in allowed:
            self.stdout.write(f"Ruxsat etilmagan chatdan xabar: chat_id={chat_id}")
            return

        self.stdout.write(f"Xabar keldi: chat_id={chat_id} text={text[:120]!r}")

        try:
            reply = services.handle_command(text, services.get_default_days())
        except Exception as exc:  # noqa: BLE001
            self.stderr.write(f"Buyruqni bajarishda xato: {exc}")
            reply = "⚠️ Xatolik yuz berdi, keyinroq urinib ko'ring."

        if reply is None:
            return

        try:
            services.send_message(chat_id, reply)
        except Exception as exc:  # noqa: BLE001
            self.stderr.write(f"sendMessage xatosi (chat_id={chat_id}): {exc}")
