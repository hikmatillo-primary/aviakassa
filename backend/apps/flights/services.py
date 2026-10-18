"""Partiyalar va avto-xarid bilan ishlovchi xizmatlar (Service Layer)."""
import uuid
from datetime import timedelta
from typing import List, Optional, Tuple
from django.db import transaction
from django.utils import timezone

from apps.flights.models import Batch
from core.db_state import get_active_alias


MAX_AUTO_BATCHES = 60


def generate_auto_batches(
    base_data: dict,
    first_date,
    until_date,
    interval_days: int = 7,
    gap_days: Optional[int] = None,
    flight_number: str = "",
    db: Optional[str] = None,
) -> Tuple[List[Batch], List[str], str]:
    """Jadval bo'yicha partiyalarni hisobga olinmagan holatda yaratadi."""
    db = db or get_active_alias()
    dates = []
    cursor = first_date
    while cursor <= until_date and len(dates) < MAX_AUTO_BATCHES:
        dates.append(cursor)
        cursor += timedelta(days=interval_days)

    if len(dates) >= MAX_AUTO_BATCHES and cursor <= until_date:
        raise ValueError(
            f"Bir marta ko'pi bilan {MAX_AUTO_BATCHES} ta partiya yaratiladi. Sanani qisqartiring."
        )

    flight_number = (flight_number or "").strip()
    skipped = []
    if flight_number:
        existing = set(
            Batch.objects.using(db)
            .filter(flight_number=flight_number, flight_date__in=dates)
            .values_list("flight_date", flat=True)
        )
        skipped = [d for d in dates if d in existing]
        dates = [d for d in dates if d not in existing]

    series_id = uuid.uuid4()
    created = []
    with transaction.atomic(using=db):
        for flight_date in dates:
            batch = Batch(
                **base_data,
                flight_date=flight_date,
                return_date=(
                    flight_date + timedelta(days=gap_days)
                    if gap_days is not None
                    else None
                ),
                is_auto=True,
                accounted_at=None,
                series_id=series_id,
                status=Batch.Status.ACTIVE,
            )
            batch.save(using=db)
            created.append(batch)

    return created, [d.isoformat() for d in skipped], str(series_id)


def account_batch(batch: Batch, db: Optional[str] = None) -> Batch:
    """Partiyani hamkor balansiga hisobga oladi."""
    db = db or get_active_alias()
    if batch.accounted_at is None:
        batch.accounted_at = timezone.now()
        batch.save(using=db, update_fields=["accounted_at"])
    return batch


def account_batches_bulk(
    series_id: Optional[str] = None,
    ids: Optional[List[int]] = None,
    db: Optional[str] = None,
) -> int:
    """Bir nechta partiyani yoki butun seriyani birdan hisobga oladi."""
    db = db or get_active_alias()
    qs = Batch.objects.using(db).filter(accounted_at__isnull=True)
    if series_id:
        qs = qs.filter(series_id=series_id)
    elif ids:
        qs = qs.filter(pk__in=ids)
    else:
        raise ValueError("seriesId yoki ids ko'rsatilishi kerak.")
    return qs.update(accounted_at=timezone.now())
