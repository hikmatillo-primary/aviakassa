from django.db import models
from apps.partners.models import Partner

class Batch(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Faol'
        COMPLETED = 'COMPLETED', 'Tugagan'

    batch_number = models.CharField(max_length=100, unique=True, verbose_name="Partiya raqami")
    route = models.CharField(max_length=255, verbose_name="Marshrut (Yo'nalish)")
    flight_date = models.DateField(verbose_name="Parvoz sanasi")
    flight_number = models.CharField(max_length=50, blank=True, default="", verbose_name="Reys raqami")
    departure_time = models.CharField(max_length=20, blank=True, default="08:00", verbose_name="Uchish vaqti")
    arrival_time = models.CharField(max_length=20, blank=True, default="11:30", verbose_name="Qo'nish vaqti")
    
    is_round_trip = models.BooleanField(default=False, verbose_name="Borish-kelish (Obratno)")
    return_date = models.DateField(blank=True, null=True, verbose_name="Qaytish sanasi")
    return_flight_number = models.CharField(max_length=50, blank=True, default="", verbose_name="Qaytish reys raqami")
    return_departure_time = models.CharField(max_length=20, blank=True, default="14:00", verbose_name="Qaytish uchish vaqti")
    return_arrival_time = models.CharField(max_length=20, blank=True, default="17:30", verbose_name="Qaytish qo'nish vaqti")

    purchase_date = models.DateField(blank=True, null=True, verbose_name="Xarid sanasi")
    baggage = models.CharField(max_length=50, blank=True, default="20kg", verbose_name="Bagaj")

    supplier = models.ForeignKey(
        Partner,
        on_delete=models.PROTECT,
        related_name="batches",
        verbose_name="Yetkazib beruvchi (Vendor)"
    )

    total_qty = models.PositiveIntegerField(verbose_name="Jami chiptalar soni")
    remaining_qty = models.PositiveIntegerField(verbose_name="Qolgan chiptalar soni")
    buy_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="1 ta chipta tan narxi ($)")
    total_cost = models.DecimalField(max_digits=14, decimal_places=2, verbose_name="Jami xarid summasi ($)")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, verbose_name="Holati")
    notes = models.TextField(blank=True, null=True, verbose_name="Izoh")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan vaqti")

    class Meta:
        verbose_name = "Partiya (Chiptalar bloki)"
        verbose_name_plural = "Partiyalar"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.batch_number} - {self.route} ({self.flight_date})"

    def save(self, *args, **kwargs):
        self.total_cost = self.buy_price * self.total_qty
        if self.remaining_qty is None:
            self.remaining_qty = self.total_qty
        if self.remaining_qty == 0:
            self.status = self.Status.COMPLETED
        elif self.remaining_qty > 0 and self.status == self.Status.COMPLETED:
            self.status = self.Status.ACTIVE
        super().save(*args, **kwargs)
