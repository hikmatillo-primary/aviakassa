"""Telegram botni long-polling rejimida ishga tushiruvchi management command."""
import signal
import time
from contextlib import contextmanager

from django.core.management.base import BaseCommand, CommandError

from apps.telegram_bot import services
from core.db_state import reset_active_alias, set_active_alias


@contextmanager
def active_database():
    """Bot so'rovi faol bazaga yo'naltirilishini ta'minlaydi.

    Bot management command sifatida ishlaydi — unda HTTP middleware yo'q, shuning
    uchun faol bazani o'zi aniqlab qo'yishi kerak. Aks holda boshqa baza faol
    bo'lganda bot `default` bazadan noto'g'ri ma'lumot o'qib yuboradi.
    """
    token = None
    try:
        from apps.control.services import resolve_active_alias

        token = set_active_alias(resolve_active_alias())
    except Exception:  # noqa: BLE001 - baza topilmasa `default` bilan davom etamiz
        token = None
    try:
        yield
    finally:
        if token is not None:
            reset_active_alias(token)

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
                try:
                    self._handle_update(update)
                except Exception as exc:  # noqa: BLE001
                    self.stderr.write(f"Update'ni qayta ishlashda xato: {exc}")

        self.stdout.write("Bot to'xtatildi.")

    def _handle_update(self, update):
        with active_database():
            self._dispatch_update(update)

    def _dispatch_update(self, update):
        if "callback_query" in update:
            self._handle_callback_query(update["callback_query"])
            return
        if "my_chat_member" in update:
            self._handle_my_chat_member(update)
            return
        message = update.get("message")
        if message:
            self._handle_message(message)

    def _handle_message(self, message):
        chat = message.get("chat") or {}
        chat_id = chat.get("id")
        chat_type = chat.get("type", "private")
        text = message.get("text")
        if chat_id is None or not text:
            return

        if not services.is_chat_allowed(chat_id, chat_type):
            self.stdout.write(f"Ruxsat yo'q: chat_id={chat_id} type={chat_type} text={text[:80]!r}")
            if chat_type == "private":
                try:
                    services.send_message(chat_id, "🚫 Ruxsat yo'q. Administratorga murojaat qiling.")
                except Exception as exc:  # noqa: BLE001
                    self.stderr.write(f"sendMessage xatosi (chat_id={chat_id}): {exc}")
            return

        self.stdout.write(f"Xabar keldi: chat_id={chat_id} type={chat_type} text={text[:120]!r}")

        try:
            reply = services.handle_command(text, services.get_default_days())
        except Exception as exc:  # noqa: BLE001
            self.stderr.write(f"Buyruqni bajarishda xato: {exc}")
            reply = {"text": "⚠️ Xatolik yuz berdi, keyinroq urinib ko'ring."}

        if not reply:
            return

        try:
            services.send_message(chat_id, reply["text"], reply_markup=reply.get("reply_markup"))
        except Exception as exc:  # noqa: BLE001
            self.stderr.write(f"sendMessage xatosi (chat_id={chat_id}): {exc}")

    def _handle_callback_query(self, callback):
        callback_id = callback.get("id")
        data = callback.get("data") or ""
        message = callback.get("message") or {}
        chat = message.get("chat") or {}
        chat_id = chat.get("id")
        chat_type = chat.get("type", "private")

        if callback_id:
            try:
                services.answer_callback(callback_id)
            except Exception as exc:  # noqa: BLE001
                self.stderr.write(f"answerCallbackQuery xatosi: {exc}")

        if chat_id is None:
            return

        if not services.is_chat_allowed(chat_id, chat_type):
            self.stdout.write(f"Callback ruxsat yo'q: chat_id={chat_id} type={chat_type} data={data!r}")
            return

        self.stdout.write(f"Tugma bosildi: chat_id={chat_id} type={chat_type} data={data!r}")

        try:
            reply = services.handle_callback(data, services.get_default_days())
        except Exception as exc:  # noqa: BLE001
            self.stderr.write(f"Callback'ni bajarishda xato: {exc}")
            reply = {"text": "⚠️ Xatolik yuz berdi, keyinroq urinib ko'ring."}

        if not reply:
            return

        try:
            services.send_message(chat_id, reply["text"], reply_markup=reply.get("reply_markup"))
        except Exception as exc:  # noqa: BLE001
            self.stderr.write(f"sendMessage xatosi (chat_id={chat_id}): {exc}")

    def _handle_my_chat_member(self, update):
        chat = update.get("chat") or {}
        chat_id = chat.get("id")
        chat_type = chat.get("type")
        new_member = update.get("new_chat_member") or {}
        status = new_member.get("status")

        if chat_id is None or chat_type not in ("group", "supergroup"):
            return

        is_admin = status == "administrator"
        services.register_group(chat_id, chat.get("title") or "", is_admin=is_admin)
        self.stdout.write(
            f"Guruh yangilandi: chat_id={chat_id} title={chat.get('title')!r} "
            f"status={status} admin={is_admin}"
        )

        if is_admin:
            try:
                services.send_message(
                    chat_id,
                    "✅ Bot admin qilib tayinlandi.\n"
                    "Endi hisobotlarni shu guruhga yuborish mumkin.",
                )
            except Exception as exc:  # noqa: BLE001
                self.stderr.write(f"Guruhga xabar yuborishda xato (chat_id={chat_id}): {exc}")
