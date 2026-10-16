from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from apps.flights.models import Batch
from apps.partners.models import Partner

from . import services


class ExpiringBatchesQueryTests(TestCase):
    def setUp(self):
        self.today = timezone.localdate()
        self.supplier = Partner.objects.create(name="Test Vendor", type=Partner.PartnerType.SUPPLIER)

    def _batch(self, number, flight_date, remaining=5, total=10, **kwargs):
        return Batch.objects.create(
            batch_number=number,
            route="TAS - DXB",
            flight_date=flight_date,
            supplier=self.supplier,
            total_qty=total,
            remaining_qty=remaining,
            buy_price=100,
            **kwargs,
        )

    def test_upcoming_and_overdue_split(self):
        soon = self._batch("P00001", self.today + timedelta(days=3))
        far = self._batch("P00002", self.today + timedelta(days=10))
        expired = self._batch("P00003", self.today - timedelta(days=2))
        sold_out = self._batch("P00004", self.today + timedelta(days=2), remaining=0, total=10)

        upcoming, overdue = services.get_expiring_batches(5, self.today)

        self.assertEqual([b.pk for b in upcoming], [soon.pk])
        self.assertEqual([b.pk for b in overdue], [expired.pk])
        self.assertNotIn(far.pk, [b.pk for b in upcoming])
        self.assertNotIn(sold_out.pk, [b.pk for b in upcoming])

    def test_round_trip_uses_return_date(self):
        round_trip = self._batch(
            "P00010",
            self.today - timedelta(days=5),
            is_round_trip=True,
            return_date=self.today + timedelta(days=2),
        )
        upcoming, overdue = services.get_expiring_batches(5, self.today)
        self.assertEqual([b.pk for b in upcoming], [round_trip.pk])
        self.assertEqual(overdue, [])

    def test_boundary_today_and_exact_days(self):
        today_batch = self._batch("P00020", self.today)
        edge = self._batch("P00021", self.today + timedelta(days=5))
        beyond = self._batch("P00022", self.today + timedelta(days=6))

        upcoming, _ = services.get_expiring_batches(5, self.today)
        ids = [b.pk for b in upcoming]
        self.assertIn(today_batch.pk, ids)
        self.assertIn(edge.pk, ids)
        self.assertNotIn(beyond.pk, ids)

    def test_ordering_by_expiry(self):
        later = self._batch("P00030", self.today + timedelta(days=4))
        sooner = self._batch("P00031", self.today + timedelta(days=1))
        upcoming, _ = services.get_expiring_batches(5, self.today)
        self.assertEqual([b.pk for b in upcoming], [sooner.pk, later.pk])


class MessageFormattingTests(TestCase):
    def setUp(self):
        self.today = timezone.localdate()
        self.supplier = Partner.objects.create(name="Hikmatillo", type=Partner.PartnerType.SUPPLIER)
        self.batch = Batch.objects.create(
            batch_number="P00002",
            route="TAS - DXB",
            flight_date=self.today + timedelta(days=1),
            flight_number="FZ-780",
            supplier=self.supplier,
            total_qty=50,
            remaining_qty=45,
            buy_price=250,
        )

    def test_message_contains_batch_details(self):
        upcoming, overdue = services.get_expiring_batches(5, self.today)
        text = services.format_expiring_message(upcoming, overdue, 5, self.today)
        self.assertIn("P00002", text)
        self.assertIn("TAS - DXB", text)
        self.assertIn("FZ-780", text)
        self.assertIn("<b>45</b> / 50 ta", text)
        self.assertIn("Hikmatillo", text)
        self.assertIn("1 kun qoldi", text)

    def test_empty_message(self):
        text = services.format_expiring_message([], [], 5, self.today)
        self.assertIn("yo'q", text)

    def test_overdue_section(self):
        Batch.objects.create(
            batch_number="P00001",
            route="TAS - IST",
            flight_date=self.today - timedelta(days=2),
            supplier=self.supplier,
            total_qty=10,
            remaining_qty=3,
            buy_price=100,
        )
        _, overdue = services.get_expiring_batches(5, self.today)
        text = services.format_expiring_message([], overdue, 5, self.today)
        self.assertIn("Muddati o'tgan", text)
        self.assertIn("P00001", text)
        self.assertIn("2 kun o'tgan", text)

    def test_html_escaping(self):
        self.supplier.name = "<Vendor & Co>"
        self.supplier.save()
        Batch.objects.create(
            batch_number="P00099",
            route="TAS <b>XSS</b>",
            flight_date=self.today + timedelta(days=2),
            supplier=self.supplier,
            total_qty=5,
            remaining_qty=5,
            buy_price=100,
        )
        upcoming, _ = services.get_expiring_batches(5, self.today)
        text = services.format_expiring_message(upcoming, [], 5, self.today)
        self.assertNotIn("<b>XSS</b>", text)
        self.assertIn("&lt;b&gt;XSS&lt;/b&gt;", text)
        self.assertIn("&lt;Vendor &amp; Co&gt;", text)


class HandleCommandTests(TestCase):
    def setUp(self):
        self.today = timezone.localdate()
        self.supplier = Partner.objects.create(name="Vendor", type=Partner.PartnerType.SUPPLIER)
        Batch.objects.create(
            batch_number="P00005",
            route="TAS - DXB",
            flight_date=self.today + timedelta(days=3),
            supplier=self.supplier,
            total_qty=10,
            remaining_qty=4,
            buy_price=100,
        )
        Batch.objects.create(
            batch_number="P00006",
            route="TAS - DXB",
            flight_date=self.today + timedelta(days=20),
            supplier=self.supplier,
            total_qty=10,
            remaining_qty=4,
            buy_price=100,
        )

    def test_start_returns_help(self):
        self.assertEqual(services.handle_command("/start", 5), services.HELP_TEXT)

    def test_plain_text_ignored(self):
        self.assertIsNone(services.handle_command("salom", 5))

    def test_muddati_default_days(self):
        reply = services.handle_command("/muddati", 5)
        self.assertIn("P00005", reply)
        self.assertNotIn("P00006", reply)

    def test_muddati_custom_days(self):
        reply = services.handle_command("/muddati 30", 5)
        self.assertIn("P00005", reply)
        self.assertIn("P00006", reply)

    def test_muddati_invalid_days(self):
        reply = services.handle_command("/muddati abc", 5)
        self.assertIn("butun son", reply)

    def test_muddati_with_bot_username_suffix(self):
        reply = services.handle_command("/muddati@aviakassa_bot", 5)
        self.assertIn("P00005", reply)

    def test_unknown_command(self):
        reply = services.handle_command("/nomalum", 5)
        self.assertIn("Noma'lum buyruq", reply)


class EnvSettingsTests(TestCase):
    def test_default_days(self):
        import os
        from unittest import mock

        with mock.patch.dict(os.environ, {}, clear=False):
            os.environ.pop("TELEGRAM_EXPIRING_DAYS", None)
            self.assertEqual(services.get_default_days(), 5)

        with mock.patch.dict(os.environ, {"TELEGRAM_EXPIRING_DAYS": "7"}):
            self.assertEqual(services.get_default_days(), 7)

        with mock.patch.dict(os.environ, {"TELEGRAM_EXPIRING_DAYS": "abc"}):
            self.assertEqual(services.get_default_days(), 5)

    def test_allowed_chat_ids(self):
        import os
        from unittest import mock

        with mock.patch.dict(os.environ, {"TELEGRAM_ALLOWED_CHAT_IDS": "1, 2 ,x,"}):
            self.assertEqual(services.get_allowed_chat_ids(), {1, 2})

        with mock.patch.dict(os.environ, {"TELEGRAM_ALLOWED_CHAT_IDS": ""}):
            self.assertEqual(services.get_allowed_chat_ids(), set())
