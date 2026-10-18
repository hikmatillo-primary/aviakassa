"""Barcha bazalarni (asosiy + ro'yxatdagi) JSON nusxaga saqlaydi.

Serverdagi `backup.sh` faqat `aviakassa_db`ni (pg_dump) saqlaydi — ko'p-bazali
rejimda qo'shimcha bazalar (masalan, alohida filial bazasi) nusxasiz qolib
ketadi. Bu buyruq har bir bazani alohida arxivlaydi va gitda saqlanadi:

    python manage.py backup_databases --outdir /root/aviakassa_backups

Har bir baza uchun: `<outdir>/<db_name>_<YYYYmmdd_HHMM>.json.gz`
(sessiyalar, contenttypes, admin log va token blacklist chiqarib tashlanadi).

Tiklash (alias = `default` yoki baza nomi):

    gunzip -c aviakassa_db_20261018_1200.json.gz > data.json
    python manage.py loaddata --database=<alias> data.json

Cron misoli (har kuni 03:20 da):

    20 3 * * * cd /opt/aviakassa && docker compose exec -T backend \\
        python manage.py backup_databases --outdir /backups \\
        >> /var/log/aviakassa_backup.log 2>&1
"""
import gzip
import re
from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

# Tiklashda kerak bo'lmaydigan texnik ilovalar (nusxani yengil qiladi).
EXCLUDED_APPS = ["contenttypes", "sessions", "admin", "token_blacklist"]


class Command(BaseCommand):
    help = (
        "Har bir bazani (asosiy + ro'yxatdagi) gzip JSON nusxa qilib saqlaydi. "
        "Ko'p-bazali rejimda `backup.sh` o'rnini to'ldiradi."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--outdir", default=None,
            help="Nusxalar papkasi (standart: backend/backups).",
        )
        parser.add_argument(
            "--databases", nargs="*", default=None,
            help="Faqat ko'rsatilgan db_name'larni saqlash (standart: hammasi).",
        )

    def handle(self, *args, **options):
        outdir = Path(options["outdir"]) if options["outdir"] else Path(settings.BASE_DIR) / "backups"
        outdir.mkdir(parents=True, exist_ok=True)

        targets = self._targets(options["databases"])
        if not targets:
            self.stderr.write(self.style.WARNING("Saqlanadigan baza topilmadi."))
            return

        stamp = timezone.localtime().strftime("%Y%m%d_%H%M")
        saved = []
        failed = []

        for label, alias in targets:
            safe = re.sub(r"[^A-Za-z0-9_.-]+", "_", label) or "baza"
            path = outdir / f"{safe}_{stamp}.json.gz"
            part = path.with_suffix(path.suffix + ".part")
            excluded = list(EXCLUDED_APPS)
            if alias != "default":
                # `control` jadvallari faqat asosiy bazada yaratiladi
                # (db_router.allow_migrate) — boshqa bazalarda jadval yo'q.
                excluded.append("control")
            try:
                with gzip.open(part, "wt", encoding="utf-8") as fh:
                    call_command(
                        "dumpdata",
                        database=alias,
                        exclude=excluded,
                        stdout=fh,
                        verbosity=0,
                    )
                part.replace(path)
            except Exception as exc:
                part.unlink(missing_ok=True)
                failed.append((label, exc))
                self.stderr.write(self.style.ERROR(f"XATO: {label} — {exc}"))
                continue

            size = path.stat().st_size
            saved.append(label)
            self.stdout.write(f"OK: {label} → {path} ({size} bayt)")

        if saved:
            self.stdout.write(self.style.SUCCESS(
                f"{len(saved)} baza saqlandi: {outdir}"
            ))
        if failed:
            raise CommandError(
                f"{len(failed)} bazani saqlab bo'lmadi: "
                + ", ".join(label for label, _ in failed)
            )

    def _targets(self, only):
        """(db_name, alias) juftliklari: asosiy baza birinchi, keyin ro'yxatdagilar."""
        from apps.control.services import default_db_name, ensure_alias

        names = [(str(default_db_name()), "default")]
        try:
            from apps.control.models import DatabaseRegistry

            for registry in DatabaseRegistry.objects.using("default").all():
                names.append((registry.db_name, ensure_alias(registry.db_name)))
        except Exception as exc:
            self.stderr.write(
                f"Bazalar ro'yxatini o'qib bo'lmadi ({exc}) — faqat asosiy baza saqlanadi."
            )

        seen = set()
        targets = []
        for db_name, alias in names:
            if db_name in seen:
                continue
            seen.add(db_name)
            targets.append((db_name, alias))

        if only:
            selected = set(only)
            targets = [t for t in targets if t[0] in selected]
        return targets
