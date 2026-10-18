import logging

from django.core.management import call_command
from django.core.management.color import no_style
from django.db import (
    IntegrityError,
    OperationalError,
    ProgrammingError,
    connections,
    transaction,
)
from django.utils import timezone
from django.utils.text import slugify

from apps.partners.models import Partner
from apps.flights.models import Batch, BatchCategory
from apps.sales.models import Sale
from apps.cash.models import Payment, DebtOffset, CashAccount

from .models import DatabaseRegistry

logger = logging.getLogger(__name__)

DEFAULT_ALIAS = "default"
MAINTENANCE_DB = "postgres"

# Ko'chirish tartibi (FK bog'liqlik bo'yicha: ota -> bola)
CATEGORY_ORDER = [
    ("accounts", CashAccount),
    ("partners", Partner),
    ("categories", BatchCategory),
    ("batches", Batch),
    ("sales", Sale),
    ("payments", Payment),
    ("debtOffsets", DebtOffset),
]
CATEGORY_KEYS = [key for key, _ in CATEGORY_ORDER]


class DatabaseError(Exception):
    """Baza bilan ishlashdagi foydalanuvchiga ko'rsatiladigan xatolik."""


def default_db_name() -> str:
    return connections.databases[DEFAULT_ALIAS]["NAME"]


def alias_for(db_name: str) -> str:
    """Asosiy baza uchun `default`, qolganlar uchun alias = db_name."""
    return DEFAULT_ALIAS if db_name == default_db_name() else db_name


def ensure_alias(db_name: str) -> str:
    """Kerakli baza uchun Django ulanish aliasini tayyorlaydi (lazy)."""
    alias = alias_for(db_name)
    if alias == DEFAULT_ALIAS:
        return alias
    if alias not in connections.databases:
        config = dict(connections.databases[DEFAULT_ALIAS])
        config["NAME"] = db_name
        connections.databases[alias] = config
    return alias


def normalize_categories(copy: dict) -> set:
    """
    Tanlangan kategoriyalarni tozalaydi va majburiy bog'liqliklarni qo'shadi:
    sotuvlar -> partiyalar; partiyalar -> xarid turlari, hamkorlar;
    partiyalar/sotuvlar/to'lovlar/qarz surishlar -> hamkorlar;
    to'lovlar -> kassa hisoblari.
    """
    selected = {key for key in CATEGORY_KEYS if bool((copy or {}).get(key))}

    if selected & {"batches", "sales", "payments", "debtOffsets"}:
        selected.add("partners")
    if "batches" in selected:
        selected.add("categories")
    if "sales" in selected:
        selected.add("batches")
        selected.add("categories")
    if "payments" in selected:
        selected.add("accounts")

    return selected


def _maintenance_connection():
    import psycopg2

    base = connections.databases[DEFAULT_ALIAS]
    conn = psycopg2.connect(
        dbname=MAINTENANCE_DB,
        user=base.get("USER") or None,
        password=base.get("PASSWORD") or None,
        host=base.get("HOST") or None,
        port=base.get("PORT") or None,
    )
    conn.autocommit = True
    return conn


def _existing_pg_databases() -> set:
    """PostgreSQL'dagi mavjud bazalar nomlari (orphan'larni ham hisobga olish)."""
    try:
        conn = _maintenance_connection()
    except Exception as exc:  # pragma: no cover - himoyaviy
        logger.warning("PostgreSQL bazalarini o'qib bo'lmadi: %s", exc)
        return set()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT datname FROM pg_database")
            return {row[0] for row in cur.fetchall()}
    finally:
        conn.close()


def _unique_db_name(name: str) -> str:
    slug = slugify(name).replace("-", "_") or "baza"
    base = f"aviakassa_{slug}"[:50]
    existing = set(
        DatabaseRegistry.objects.using(DEFAULT_ALIAS).values_list("db_name", flat=True)
    )
    existing |= _existing_pg_databases()
    candidate = base
    counter = 2
    while candidate in existing:
        candidate = f"{base}_{counter}"[:63]
        counter += 1
    return candidate


def _create_postgres_database(db_name: str) -> None:
    conn = _maintenance_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(f'CREATE DATABASE "{db_name}"')
    finally:
        conn.close()


def _drop_postgres_database(db_name: str) -> None:
    """Yaratishda xato bo'lsa, yarim tayyor bazani o'chirib tashlaydi."""
    try:
        conn = _maintenance_connection()
    except Exception as exc:  # pragma: no cover - himoyaviy
        logger.warning("Yarim tayyor bazani o'chirib bo'lmadi: %s", exc)
        return
    try:
        with conn.cursor() as cur:
            cur.execute(f'DROP DATABASE IF EXISTS "{db_name}"')
    except Exception as exc:  # pragma: no cover - himoyaviy
        logger.warning("Yarim tayyor bazani o'chirib bo'lmadi (%s): %s", db_name, exc)
    finally:
        conn.close()


def _reset_sequences(model, alias: str) -> None:
    """PK'larni saqlab ko'chirgandan so'ng ketma-ketlikni to'g'rilaydi."""
    try:
        conn = connections[alias]
        statements = conn.ops.sequence_reset_sql(no_style(), [model])
        if not statements:
            return
        with conn.cursor() as cur:
            for statement in statements:
                cur.execute(statement)
    except Exception as exc:  # pragma: no cover - himoyaviy
        logger.warning("Ketma-ketlikni tiklashda xato (%s): %s", model.__name__, exc)


def _copy_model(model, source_alias: str, target_alias: str) -> int:
    """
    Modelning barcha yozuvlarini manba bazadan yangi bazaga ko'chiradi.
    PK'lar saqlanadi (FK'lar buzilmaydi), `created_at` ham asl qiymatida qoladi.
    `bulk_create` ishlatiladi — model save() side-effect'lari ishlamaydi.
    """
    objects = list(model.objects.using(source_alias).all())
    if not objects:
        return 0

    original_created = {}
    if hasattr(model, "created_at"):
        original_created = {obj.pk: obj.created_at for obj in objects}

    model.objects.using(target_alias).bulk_create(objects, batch_size=500)

    if original_created:
        # bulk_create auto_now_add'ni "hozir"ga o'zgartiradi — asl qiymatni tiklaymiz.
        fresh = [
            model(pk=pk, created_at=created)
            for pk, created in original_created.items()
        ]
        model.objects.using(target_alias).bulk_update(
            fresh, ["created_at"], batch_size=500
        )

    _reset_sequences(model, target_alias)
    return len(objects)


def copy_selected(source_db_name: str, target_db_name: str, categories: set) -> dict:
    """Tanlangan kategoriyalarni manba bazadan yangi bazaga ko'chiradi (atomik)."""
    source_alias = ensure_alias(source_db_name)
    target_alias = ensure_alias(target_db_name)

    copied = {}
    with transaction.atomic(using=target_alias):
        if "accounts" in categories:
            # Yangi bazada migratsiya yaratgan standart hisoblarni tozalaymiz:
            # manba hisoblari PK'larini saqlagan holda ko'chiriladi.
            CashAccount.objects.using(target_alias).all().delete()
        for key, model in CATEGORY_ORDER:
            if key not in categories:
                continue
            copied[key] = _copy_model(model, source_alias, target_alias)
    return copied


def create_database(name: str, copy: dict) -> dict:
    """
    Yangi alohida PostgreSQL bazasini yaratadi, migratsiyalarni o'tkazadi va
    tanlangan kategoriyalarni joriy faol bazadan ko'chiradi.
    """
    name = (name or "").strip()
    if not name:
        raise DatabaseError("Baza nomi majburiy.")

    categories = normalize_categories(copy or {})
    db_name = _unique_db_name(name)
    source_db_name = active_db_name()

    logger.warning(
        "BAZA YARATILMOQDA: name=%s db=%s source=%s categories=%s",
        name, db_name, source_db_name, sorted(categories),
    )

    _create_postgres_database(db_name)
    alias = ensure_alias(db_name)

    try:
        call_command("migrate", database=alias, interactive=False, verbosity=0)
        copied = copy_selected(source_db_name, db_name, categories)
    except Exception as exc:
        logger.exception("Yangi bazani tayyorlashda xato: %s", exc)
        # Yarim tayyor bazani va ulanishni tozalaymiz — keyingi urinishga xalaqit bermasin.
        try:
            connections[alias].close()
        except Exception:  # pragma: no cover - himoyaviy
            pass
        connections.databases.pop(alias, None)
        _drop_postgres_database(db_name)
        raise DatabaseError(f"Yangi bazani tayyorlab bo'lmadi: {exc}") from exc

    registry = DatabaseRegistry.objects.using(DEFAULT_ALIAS).create(
        name=name, db_name=db_name, is_active=False
    )
    logger.warning("BAZA YARATILDI: db=%s copied=%s", db_name, copied)
    return {"database": registry, "copied": copied}


def activate_database(registry_id: int) -> DatabaseRegistry:
    """Bazani faol qiladi (hamma foydalanuvchi uchun umumiy)."""
    with transaction.atomic(using=DEFAULT_ALIAS):
        registry = (
            DatabaseRegistry.objects.using(DEFAULT_ALIAS)
            .select_for_update()
            .get(pk=registry_id)
        )
        DatabaseRegistry.objects.using(DEFAULT_ALIAS).filter(is_active=True).exclude(
            pk=registry_id
        ).update(is_active=False)
        registry.is_active = True
        registry.save(using=DEFAULT_ALIAS, update_fields=["is_active"])

    logger.warning("BAZA FAOLLASHTIRILDI: db=%s", registry.db_name)
    return registry


def close_database(registry_id: int) -> DatabaseRegistry:
    """Bazani arxivlaydi (yopadi). Baza ishlashda davom etadi."""
    registry = DatabaseRegistry.objects.using(DEFAULT_ALIAS).get(pk=registry_id)
    if registry.closed_at is None:
        registry.closed_at = timezone.now()
        registry.save(using=DEFAULT_ALIAS, update_fields=["closed_at"])
    logger.warning("BAZA YOPILDI: db=%s", registry.db_name)
    return registry


def delete_database(registry_id: int) -> str:
    """Bazani o'chiradi (PostgreSQL bazasini va registry yozuvini).

    Asosiy baza (DEFAULT_ALIAS) yoki ayni vaqtda faol (is_active=True)
    bo'lgan bazani o'chirib bo'lmaydi.
    """
    with transaction.atomic(using=DEFAULT_ALIAS):
        registry = (
            DatabaseRegistry.objects.using(DEFAULT_ALIAS)
            .select_for_update()
            .get(pk=registry_id)
        )
        if registry.is_active:
            raise DatabaseError("Faol bazani o'chirib bo'lmaydi. Avval boshqa bazaga o'ting.")
        if registry.db_name == default_db_name():
            raise DatabaseError("Asosiy bazani o'chirib bo'lmaydi.")

        db_name = registry.db_name
        name = registry.name
        registry.delete(using=DEFAULT_ALIAS)

    # Ulanishni yopish va PostgreSQL bazasini o'chirish
    alias = alias_for(db_name)
    if alias in connections:
        try:
            connections[alias].close()
        except Exception:
            pass
        connections.databases.pop(alias, None)

    _drop_postgres_database(db_name)
    logger.warning("BAZA O'CHIRILDI: name=%s db=%s", name, db_name)
    return name


def active_db_name() -> str:
    """Faol baza nomini qaytaradi.

    Kesh ishlatilmaydi: baza almashganda barcha gunicorn ishchilari darhol
    yangi bazani ko'rishi kerak. Har bir so'rovda bitta indeksli so'rov —
    bu xavfsizlik uchun arziydi.
    """
    db_name = default_db_name()
    try:
        registry = (
            DatabaseRegistry.objects.using(DEFAULT_ALIAS)
            .filter(is_active=True)
            .first()
        )
        if registry:
            db_name = registry.db_name
        else:
            # Faol baza yo'q: mavjud bazani "Asosiy baza" sifatida qabul qilamiz.
            default_name = default_db_name()
            try:
                DatabaseRegistry.objects.using(DEFAULT_ALIAS).create(
                    name="Asosiy baza", db_name=default_name, is_active=True
                )
            except IntegrityError:
                # Boshqa worker allaqachon yaratgan — faollashtiramiz.
                DatabaseRegistry.objects.using(DEFAULT_ALIAS).filter(
                    db_name=default_name
                ).update(is_active=True)
            db_name = default_name
            logger.warning("ASOSIY BAZA RO'YXATGA OLINDI: db=%s", db_name)
    except (ProgrammingError, OperationalError):
        # Jadval hali yaratilmagan (migratsiyadan oldin) — asosiy bazaga qaytamiz.
        db_name = default_db_name()

    return db_name


def resolve_active_alias() -> str:
    return ensure_alias(active_db_name())


def invalidate_active_cache() -> None:
    """Eski API bilan moslik uchun qoldirilgan (kesh endi yo'q)."""
    return None
