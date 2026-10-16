"""Telegram Bot API klienti va muddati yaqin partiyalar hisoboti."""
import html
import json
import os
import urllib.request
from datetime import timedelta

from django.db.models import Case, DateField, F, When
from django.utils import timezone

from apps.flights.models import Batch

from .models import BotGroup

API_URL_TEMPLATE = "https://api.telegram.org/bot{token}/{method}"

UZ_MONTHS = [
    "Yan", "Fev", "Mar", "Apr", "May", "Iyn",
    "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek",
]

HELP_TEXT = (
    "👋 <b>Aviakassa bot</b>\n\n"
    "Tugmalar orqali:\n"
    "• ⏳ 3 / 5 / 10 kun — muddati yaqin chiptalar ro'yxati\n"
    "• 📤 Guruhga yuborish — hisobotni bot admin bo'lgan guruhlarga jo'natadi\n"
    "• ℹ️ Yordam\n\n"
    "Buyruqlar: /muddati, /muddati 10\n"
    "Guruhda: /muddati@fireflyak_bot yoki tugmalardan foydalaning."
)


def get_token() -> str:
    return os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()


def get_default_days() -> int:
    try:
        return max(1, int(os.environ.get("TELEGRAM_EXPIRING_DAYS", "5")))
    except ValueError:
        return 5


def get_allowed_chat_ids() -> set:
    """Shaxsiy chatlar uchun ruxsat etilgan ID'lar (bo'sh bo'lsa — hech kim)."""
    ids = set()
    for part in os.environ.get("TELEGRAM_ALLOWED_CHAT_IDS", "").split(","):
        part = part.strip()
        if part:
            try:
                ids.add(int(part))
            except ValueError:
                pass
    return ids


def is_chat_allowed(chat_id: int, chat_type: str) -> bool:
    """Shaxsiy chat — allowlist'da bo'lishi kerak; guruh — bot admin bo'lishi kerak."""
    if chat_type in ("group", "supergroup"):
        return BotGroup.objects.filter(chat_id=chat_id, is_admin=True).exists()
    return chat_id in get_allowed_chat_ids()


def register_group(chat_id: int, title: str = "", is_admin: bool = False) -> BotGroup:
    defaults = {"is_admin": is_admin}
    if title:
        defaults["title"] = title
    group, _ = BotGroup.objects.update_or_create(chat_id=chat_id, defaults=defaults)
    return group


def get_admin_groups():
    return list(BotGroup.objects.filter(is_admin=True))


def api_call(method: str, payload: dict | None = None, timeout: int = 35):
    token = get_token()
    if not token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN o'rnatilmagan")
    url = API_URL_TEMPLATE.format(token=token, method=method)
    data = json.dumps(payload or {}).encode("utf-8")
    request = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def poll_updates(offset: int, timeout: int = 30):
    data = api_call(
        "getUpdates",
        {
            "offset": offset,
            "timeout": timeout,
            "allowed_updates": ["message", "callback_query", "my_chat_member"],
        },
        timeout=timeout + 10,
    )
    return data.get("result", [])


def send_message(chat_id: int, text: str, reply_markup: dict | None = None) -> None:
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    api_call("sendMessage", payload)


def answer_callback(callback_id: str) -> None:
    api_call("answerCallbackQuery", {"callback_query_id": callback_id}, timeout=15)


def main_keyboard() -> dict:
    return {
        "inline_keyboard": [
            [
                {"text": "⏳ 3 kun", "callback_data": "expiring:3"},
                {"text": "⏳ 5 kun", "callback_data": "expiring:5"},
                {"text": "📅 10 kun", "callback_data": "expiring:10"},
            ],
            [{"text": "📤 Guruhga yuborish", "callback_data": "send_group"}],
            [{"text": "ℹ️ Yordam", "callback_data": "help"}],
        ]
    }


def batch_expiry_expression():
    """Partiyaning oxirgi parvoz sanasi: borish-kelishda — qaytish, aks holda parvoz sanasi."""
    return Case(
        When(is_round_trip=True, return_date__isnull=False, then=F("return_date")),
        default=F("flight_date"),
        output_field=DateField(),
    )


def get_expiring_batches(days: int, today=None):
    """(muddati yaqin, muddati o'tgan) partiyalar — ikkalasida ham qoldiq bor."""
    today = today or timezone.localdate()
    queryset = (
        Batch.objects.annotate(expiry=batch_expiry_expression())
        .filter(remaining_qty__gt=0)
        .select_related("supplier")
    )
    upcoming = list(
        queryset.filter(
            expiry__gte=today, expiry__lte=today + timedelta(days=days)
        ).order_by("expiry", "flight_date")
    )
    overdue = list(queryset.filter(expiry__lt=today).order_by("-expiry"))
    return upcoming, overdue


def format_date(value) -> str:
    if not value:
        return "—"
    return f"{value.day} {UZ_MONTHS[value.month - 1]} {value.year}"


def days_left_label(days: int) -> str:
    if days <= 0:
        return "bugun"
    if days == 1:
        return "1 kun qoldi"
    return f"{days} kun qoldi"


def days_passed_label(days: int) -> str:
    if days <= 1:
        return "kecha o'tgan"
    return f"{days} kun o'tgan"


def format_expiring_message(upcoming, overdue, days: int, today=None) -> str:
    today = today or timezone.localdate()
    lines = [
        f"⏳ <b>Muddati yaqin chiptalar</b> — {days} kun ichida",
        f"📅 Bugun: {format_date(today)}",
        "",
    ]

    if not upcoming:
        lines.append("✅ Yaqin kunlarda muddati tugaydigan partiya yo'q.")
    else:
        for index, batch in enumerate(upcoming, start=1):
            left = (batch.expiry - today).days
            lines.append(
                f"{index}. <b>{html.escape(batch.batch_number)}</b> — {html.escape(batch.route)}"
            )
            flight_bits = []
            if batch.flight_number:
                flight_bits.append(f"Reys: {html.escape(batch.flight_number)}")
            flight_bits.append(f"Parvoz: {format_date(batch.flight_date)}")
            lines.append(f"   ✈️ {' • '.join(flight_bits)}")
            lines.append(
                f"   ⏰ Muddati: {format_date(batch.expiry)} ({days_left_label(left)})"
            )
            lines.append(f"   🎫 Qoldiq: <b>{batch.remaining_qty}</b> / {batch.total_qty} ta")
            lines.append(f"   🤝 {html.escape(batch.supplier.name)}")
            lines.append("")

    if overdue:
        lines.append(f"⚠️ <b>Muddati o'tgan, qoldig'i bor ({len(overdue)} ta):</b>")
        for index, batch in enumerate(overdue, start=1):
            passed = (today - batch.expiry).days
            lines.append(
                f"{index}. {html.escape(batch.batch_number)} — {html.escape(batch.route)} • "
                f"{format_date(batch.expiry)} ({days_passed_label(passed)}) • "
                f"qoldiq: {batch.remaining_qty}/{batch.total_qty}"
            )

    return "\n".join(lines).strip()


def expiring_reply_text(days: int) -> str:
    today = timezone.localdate()
    upcoming, overdue = get_expiring_batches(days, today)
    return format_expiring_message(upcoming, overdue, days, today)


def reply_payload(text: str, with_keyboard: bool = False) -> dict:
    payload = {"text": text}
    if with_keyboard:
        payload["reply_markup"] = main_keyboard()
    return payload


def handle_command(text: str, days_default: int) -> dict | None:
    """Foydalanuvchi buyrug'iga javob ({text, reply_markup}) yoki None (buyruq bo'lmasa)."""
    text = (text or "").strip()
    if not text.startswith("/"):
        return None
    parts = text.split()
    command = parts[0].split("@")[0].lower()

    if command in ("/start", "/help", "/yordam"):
        return reply_payload(HELP_TEXT, with_keyboard=True)

    if command in ("/muddati", "/tez"):
        days = days_default
        if len(parts) > 1:
            try:
                days = max(1, min(60, int(parts[1])))
            except ValueError:
                return reply_payload("⚠️ Kun sonini butun son sifatida yozing, masalan: /muddati 10")
        return reply_payload(expiring_reply_text(days))

    return reply_payload("❓ Noma'lum buyruq. /help ni ko'ring.")


def handle_callback(data: str, days_default: int) -> dict | None:
    """Inline tugma bosilishiga javob ({text, reply_markup}) yoki None."""
    data = (data or "").strip()

    if data == "help":
        return reply_payload(HELP_TEXT, with_keyboard=True)

    if data == "send_group":
        groups = get_admin_groups()
        if not groups:
            return reply_payload(
                "⚠️ Bot hali hech qaysi guruhda admin emas.\n"
                "Botni guruhga qo'shib, admin qilib tayinlang — shundan keyin "
                "bu tugma hisobotni o'sha guruhga yuboradi."
            )
        report = expiring_reply_text(days_default)
        sent, failed = [], []
        for group in groups:
            try:
                send_message(group.chat_id, report)
                sent.append(group.title or str(group.chat_id))
            except Exception:  # noqa: BLE001
                failed.append(group.title or str(group.chat_id))
        parts = []
        if sent:
            parts.append("✅ Guruhga yuborildi: " + ", ".join(sent))
        if failed:
            parts.append("❌ Yuborilmadi: " + ", ".join(failed))
        return reply_payload("\n".join(parts))

    if data.startswith("expiring:"):
        try:
            days = max(1, min(60, int(data.split(":", 1)[1])))
        except ValueError:
            days = days_default
        return reply_payload(expiring_reply_text(days), with_keyboard=True)

    return None
