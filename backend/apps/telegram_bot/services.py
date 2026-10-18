"""Telegram Bot API klienti va muddati yaqin partiyalar hisoboti."""
import html
import json
import os
import urllib.request
from datetime import timedelta
from decimal import Decimal

from django.db.models import Case, DateField, F, Q, When
from django.utils import timezone

from apps.flights.models import Batch
from core.money import to_money

from .models import BotGroup

API_URL_TEMPLATE = "https://api.telegram.org/bot{token}/{method}"

UZ_MONTHS = [
    "Yan", "Fev", "Mar", "Apr", "May", "Iyn",
    "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek",
]

HELP_TEXT = (
    "✈️ <b>Aviakassa — Muddati yaqin chiptalar monitoring boti</b>\n\n"
    "Quyidagi imkoniyatlar mavjud:\n"
    "• 🔴 <b>Bugun / Ertaga</b> — 24-48 soat ichida uchadigan eng shoshilinch chiptalar\n"
    "• ⏳ <b>3 kunlik / 7 kunlik</b> — yaqin kunlarda uchadigan partiyalar va qoldiqlar\n"
    "• ⚠️ <b>Muddati o'tganlar</b> — parvoz sanasi o'tib ketgan, lekin qoldig'i qolib ketgan partiyalar\n"
    "• 🔍 <b>Qidiruv</b> — yo'nalish (masalan: <code>Jidda</code>, <code>Dubay</code>) yoki partiya raqamini yozing\n"
    "• 📤 <b>Guruhga yuborish</b> — hisobotni admin guruhlariga jo'natish\n\n"
    "<b>Buyruqlar:</b>\n"
    "• /bugun — bugun va ertaga uchadigan chiptalar\n"
    "• /muddati [kun] — masalan: <code>/muddati 3</code> yoki <code>/muddati 7</code>\n"
    "• /otgan — muddati o'tgan qoldiqli partiyalar\n"
    "• /qidir [so'z] — yo'nalish yoki partiya bo'yicha qidirish\n"
    "• /help — ushbu yordam oynasi"
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


def main_keyboard(days: int = 5) -> dict:
    """Xabar ostidagi inline tezkor boshqaruv tugmalari."""
    return {
        "inline_keyboard": [
            [
                {"text": "🔴 Bugun/Ertaga", "callback_data": "expiring:1"},
                {"text": "⏳ 3 kun", "callback_data": "expiring:3"},
                {"text": "⏳ 5 kun", "callback_data": "expiring:5"},
                {"text": "📅 7 kun", "callback_data": "expiring:7"},
            ],
            [
                {"text": "⚠️ Muddati o'tganlar", "callback_data": "overdue"},
                {"text": "📤 Guruhga yuborish", "callback_data": "send_group"},
            ],
            [{"text": "ℹ️ Yordam", "callback_data": "help"}],
        ]
    }


def main_reply_keyboard() -> dict:
    """Chatdagi doimiy pastki menyu klaviaturasi."""
    return {
        "keyboard": [
            [{"text": "🔴 Bugun / Ertaga"}, {"text": "⏳ 3 kunlik"}],
            [{"text": "📅 7 kunlik"}, {"text": "⚠️ Muddati o'tganlar"}],
            [{"text": "📤 Guruhga yuborish"}, {"text": "ℹ️ Yordam"}],
        ],
        "resize_keyboard": True,
        "is_persistent": True,
    }


def batch_expiry_expression(today=None):
    """Partiyaning eng yaqin qoldiqqa ega parvoz sanasini aniqlovchi ifoda.

    - Borish-kelishda borish o'tib ketgan yoki qoldig'i 0 bo'lsa -> return_date.
    - Borishda qoldiq bo'lsa va hali o'tmagan bo'lsa -> flight_date (chunki borish avval uchadi!).
    - Ikkalasi ham o'tib ketgan bo'lsa -> return_date (yoki flight_date).
    """
    today = today or timezone.localdate()
    return Case(
        When(
            is_round_trip=True,
            return_date__isnull=False,
            remaining_qty=0,
            then=F("return_date"),
        ),
        When(
            is_round_trip=True,
            return_date__isnull=False,
            flight_date__lt=today,
            return_date__gte=today,
            then=F("return_date"),
        ),
        When(
            remaining_qty__gt=0,
            flight_date__gte=today,
            then=F("flight_date"),
        ),
        When(
            is_round_trip=True,
            return_date__isnull=False,
            flight_date__lt=today,
            return_date__lt=today,
            then=F("return_date"),
        ),
        default=F("flight_date"),
        output_field=DateField(),
    )


def calculate_batch_details(batch, today=None):
    """Partiyaning eng yaqin muddati, qoldiqlari va xavf ostidagi summasini hisoblaydi."""
    today = today or timezone.localdate()
    outbound_qty = batch.remaining_qty or 0
    inbound_qty = (
        batch.return_remaining_qty
        if batch.return_remaining_qty is not None
        else batch.remaining_qty
    ) or 0 if batch.is_round_trip else 0

    buy_price = Decimal(str(batch.buy_price or 0))

    if batch.is_round_trip:
        half_price = buy_price / Decimal("2")
        risk_amount = (Decimal(outbound_qty) * half_price) + (Decimal(inbound_qty) * half_price)
    else:
        risk_amount = Decimal(outbound_qty) * buy_price

    expiry_date = getattr(batch, "expiry", None)
    if not expiry_date:
        if batch.is_round_trip and batch.return_date:
            if outbound_qty == 0 and inbound_qty > 0:
                expiry_date = batch.return_date
            elif batch.flight_date < today and batch.return_date >= today:
                expiry_date = batch.return_date
            else:
                expiry_date = batch.flight_date
        else:
            expiry_date = batch.flight_date

    days_left = (expiry_date - today).days

    return {
        "expiry_date": expiry_date,
        "days_left": days_left,
        "outbound_qty": outbound_qty,
        "inbound_qty": inbound_qty,
        "total_remaining": outbound_qty + (inbound_qty if batch.is_round_trip else 0),
        "buy_price": buy_price,
        "risk_amount": to_money(risk_amount),
    }


def get_expiring_batches(days: int, today=None, search_query: str = ""):
    """Muddati kelayotgan va muddati o'tgan (qoldig'i bor) partiyalarni qaytaradi."""
    today = today or timezone.localdate()
    has_remaining = Q(remaining_qty__gt=0) | (
        Q(is_round_trip=True) & Q(return_remaining_qty__gt=0)
    )
    queryset = (
        Batch.objects.annotate(expiry=batch_expiry_expression(today))
        .filter(has_remaining)
        .select_related("supplier")
    )

    if search_query:
        query = search_query.strip()
        queryset = queryset.filter(
            Q(route__icontains=query)
            | Q(batch_number__icontains=query)
            | Q(flight_number__icontains=query)
            | Q(supplier__name__icontains=query)
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


def format_money(val: Decimal | float | int) -> str:
    """Pul miqdorini $1,250 yoki $350.50 ko'rinishida formatlaydi."""
    try:
        dec = to_money(val)
        if dec == dec.to_integral():
            return f"${int(dec):,}"
        return f"${dec:,.2f}"
    except Exception:
        return f"${val}"


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


def format_expiring_message(
    upcoming, overdue, days: int, today=None, title_override: str | None = None
) -> str:
    today = today or timezone.localdate()

    # Umumiy statistika hisobi
    total_risk = Decimal("0.00")
    total_unsold = 0
    upcoming_details = []
    for b in upcoming:
        det = calculate_batch_details(b, today)
        total_risk += det["risk_amount"]
        total_unsold += det["total_remaining"]
        upcoming_details.append((b, det))

    overdue_details = []
    for b in overdue:
        det = calculate_batch_details(b, today)
        overdue_details.append((b, det))

    lines = []
    if title_override:
        lines.append(title_override)
    elif days == 1:
        lines.append("🔴 <b>SHOSHILINCH CHIPTALAR (Bugun va Ertaga)</b>")
    else:
        lines.append(f"⏳ <b>Muddati yaqin chiptalar</b> — {days} kun ichida")

    lines.append(f"📅 Bugun: {format_date(today)}")

    if upcoming:
        lines.append(
            f"📊 Jami: <b>{len(upcoming)} ta partiya</b> • <b>{total_unsold} ta qoldiq</b> • "
            f"Xavf ostida: <b>{format_money(total_risk)}</b>"
        )
    lines.append("")

    if not upcoming:
        lines.append("✅ Yaqin kunlarda muddati tugaydigan partiya yo'q.")
    else:
        # Shoshilinchlik bo'yicha guruhlash
        critical = [item for item in upcoming_details if item[1]["days_left"] <= 1]
        warning = [item for item in upcoming_details if item[1]["days_left"] > 1]

        def _render_item(idx, b, det):
            item_lines = []
            badge = "🔴" if det["days_left"] <= 1 else ("🟡" if det["days_left"] <= 4 else "🟢")
            item_lines.append(
                f"{idx}. {badge} <b>{html.escape(b.batch_number)}</b> — <b>{html.escape(b.route)}</b>"
            )

            if b.is_round_trip:
                # Borish reysi
                flight_bits = []
                if b.flight_number:
                    flight_bits.append(f"Reys: {html.escape(b.flight_number)}")
                dep_time = f" ({b.departure_time})" if b.departure_time else ""
                flight_bits.append(f"Borish: {format_date(b.flight_date)}{dep_time}")
                item_lines.append(f"   ✈️ {' • '.join(flight_bits)}")

                # Qaytish reysi
                if b.return_date:
                    ret_bits = []
                    if b.return_flight_number:
                        ret_bits.append(f"Reys: {html.escape(b.return_flight_number)}")
                    ret_dep_time = f" ({b.return_departure_time})" if b.return_departure_time else ""
                    ret_bits.append(f"Qaytish: {format_date(b.return_date)}{ret_dep_time}")
                    item_lines.append(f"   🔄 {' • '.join(ret_bits)}")

                item_lines.append(
                    f"   ⏰ Eng yaqin muddat: <b>{format_date(det['expiry_date'])}</b> "
                    f"({days_left_label(det['days_left'])})"
                )
                item_lines.append(
                    f"   🎫 Qoldiq: borish <b>{det['outbound_qty']}</b>, "
                    f"kelish <b>{det['inbound_qty']}</b> (jami {b.total_qty} ta)"
                )
            else:
                flight_bits = []
                if b.flight_number:
                    flight_bits.append(f"Reys: {html.escape(b.flight_number)}")
                dep_time = f" ({b.departure_time})" if b.departure_time else ""
                flight_bits.append(f"Parvoz: {format_date(b.flight_date)}{dep_time}")
                item_lines.append(f"   ✈️ {' • '.join(flight_bits)}")
                item_lines.append(
                    f"   ⏰ Muddati: <b>{format_date(det['expiry_date'])}</b> "
                    f"({days_left_label(det['days_left'])})"
                )
                item_lines.append(
                    f"   🎫 Qoldiq: <b>{b.remaining_qty}</b> / {b.total_qty} ta"
                )

            item_lines.append(
                f"   💸 Xavf summasi: <b>{format_money(det['risk_amount'])}</b> "
                f"({format_money(det['buy_price'])}/ta)"
            )
            item_lines.append(f"   🤝 {html.escape(b.supplier.name)}")
            return "\n".join(item_lines)

        counter = 1
        if critical:
            lines.append("🚨 <b>FAVQULODDA (Bugun va Ertaga):</b>")
            for b, det in critical:
                lines.append(_render_item(counter, b, det))
                lines.append("")
                counter += 1

        if warning:
            if critical:
                lines.append("⏳ <b>YAQIN KUNLARDA:</b>")
            for b, det in warning:
                lines.append(_render_item(counter, b, det))
                lines.append("")
                counter += 1

    if overdue:
        lines.append(f"⚠️ <b>Muddati o'tgan, qoldig'i bor ({len(overdue)} ta):</b>")
        for index, (b, det) in enumerate(overdue_details, start=1):
            passed = (today - det["expiry_date"]).days
            if b.is_round_trip:
                qoldiq_str = f"borish: {det['outbound_qty']}, kelish: {det['inbound_qty']} / {b.total_qty}"
            else:
                qoldiq_str = f"{b.remaining_qty}/{b.total_qty}"
            lines.append(
                f"{index}. <b>{html.escape(b.batch_number)}</b> — {html.escape(b.route)} • "
                f"{format_date(det['expiry_date'])} ({days_passed_label(passed)}) • "
                f"qoldiq: <b>{qoldiq_str}</b> (xavf: {format_money(det['risk_amount'])})"
            )

    return "\n".join(lines).strip()


def expiring_reply_text(days: int) -> str:
    today = timezone.localdate()
    upcoming, overdue = get_expiring_batches(days, today)
    return format_expiring_message(upcoming, overdue, days, today)


def search_reply_text(query: str) -> str:
    today = timezone.localdate()
    # 60 kunlik muddat ichida qidiruv
    upcoming, overdue = get_expiring_batches(60, today, search_query=query)
    title = f"🔍 <b>«{html.escape(query)}» bo'yicha qidiruv natijalari:</b>"
    if not upcoming and not overdue:
        return f"🔍 <b>«{html.escape(query)}»</b> bo'yicha qoldig'i bor partiyalar topilmadi."
    return format_expiring_message(upcoming, overdue, 60, today, title_override=title)


def overdue_reply_text() -> str:
    today = timezone.localdate()
    _, overdue = get_expiring_batches(1, today)
    if not overdue:
        return "✅ Muddati o'tgan, qoldig'i qolib ketgan partiyalar yo'q. Hammasi toza!"
    return format_expiring_message([], overdue, 1, today, title_override="⚠️ <b>Muddati o'tgan partiyalar ro'yxati:</b>")


def reply_payload(text: str, with_keyboard: bool = False, days: int = 5) -> dict:
    payload = {"text": text}
    if with_keyboard:
        payload["reply_markup"] = main_keyboard(days)
    return payload


def handle_message_text(text: str, days_default: int) -> dict | None:
    """Har qanday xabar (buyruq yoki tugma yoki qidiruv so'zi)ni qayta ishlaydi."""
    text = (text or "").strip()
    if not text:
        return None

    # 1. Start va Help
    if text in ("/start", "/help", "/yordam", "ℹ️ Yordam"):
        res = reply_payload(HELP_TEXT, with_keyboard=True, days=days_default)
        # Boshlang'ich chatda doimiy pastki menyuni ham ulab beramiz
        res["reply_markup"] = main_keyboard(days_default)
        res["chat_reply_markup"] = main_reply_keyboard()
        return res

    # 2. Bugun / Ertaga (Shoshilinch)
    if text in ("/bugun", "/shoshilinch", "🔴 Bugun / Ertaga"):
        return reply_payload(expiring_reply_text(1), with_keyboard=True, days=1)

    # 3. Muddati yaqin (kunlik)
    if text in ("⏳ 3 kunlik",):
        return reply_payload(expiring_reply_text(3), with_keyboard=True, days=3)

    if text in ("📅 7 kunlik",):
        return reply_payload(expiring_reply_text(7), with_keyboard=True, days=7)

    if text in ("⚠️ Muddati o'tganlar", "/otgan", "/overdue"):
        return reply_payload(overdue_reply_text(), with_keyboard=True, days=days_default)

    if text in ("📤 Guruhga yuborish",):
        return handle_callback(f"send_group:{days_default}", days_default)

    # 4. Buyruqlar: /muddati, /muddati 10
    if text.startswith("/"):
        parts = text.split()
        command = parts[0].split("@")[0].lower()

        if command in ("/muddati", "/tez"):
            days = days_default
            if len(parts) > 1:
                try:
                    days = max(1, min(60, int(parts[1])))
                except ValueError:
                    return reply_payload("⚠️ Kun sonini butun son sifatida yozing, masalan: /muddati 10")
            return reply_payload(expiring_reply_text(days), with_keyboard=True, days=days)

        if command in ("/qidir", "/search"):
            if len(parts) < 2:
                return reply_payload("🔍 Qidirish uchun so'zni ham yozing, masalan: <code>/qidir Jidda</code>")
            query = " ".join(parts[1:])
            return reply_payload(search_reply_text(query), with_keyboard=True, days=days_default)

        return reply_payload("❓ Noma'lum buyruq. /help ni ko'ring.", with_keyboard=True, days=days_default)

    # 5. Agar buyruq belgisisiz oddiy so'z yozilgan bo'lsa -> avtomatik qidiruv deb qabul qilamiz!
    return reply_payload(search_reply_text(text), with_keyboard=True, days=days_default)


def handle_command(text: str, days_default: int) -> dict | None:
    """Eski nom muvofiqligi uchun (run_telegram_bot va testlar uchun)."""
    return handle_message_text(text, days_default)


def handle_callback(data: str, days_default: int) -> dict | None:
    """Inline tugma bosilishiga javob."""
    data = (data or "").strip()

    if data == "help":
        return reply_payload(HELP_TEXT, with_keyboard=True, days=days_default)

    if data == "overdue":
        return reply_payload(overdue_reply_text(), with_keyboard=True, days=days_default)

    if data.startswith("send_group"):
        days = days_default
        if ":" in data:
            try:
                days = int(data.split(":")[1])
            except ValueError:
                days = days_default

        groups = get_admin_groups()
        if not groups:
            return reply_payload(
                "⚠️ Bot hali hech qaysi guruhda admin emas.\n"
                "Botni guruhga qo'shib, admin qilib tayinlang — shundan keyin "
                "bu tugma hisobotni o'sha guruhga yuboradi.",
                with_keyboard=True,
                days=days,
            )
        report = expiring_reply_text(days)
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
        return reply_payload("\n".join(parts), with_keyboard=True, days=days)

    if data.startswith("expiring:"):
        try:
            days = max(1, min(60, int(data.split(":", 1)[1])))
        except ValueError:
            days = days_default
        return reply_payload(expiring_reply_text(days), with_keyboard=True, days=days)

    return None
