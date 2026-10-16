from django.db import models


class DatabaseRegistry(models.Model):
    """
    Alohida bazalar ro'yxati. Bu yozuvlar faqat `default` (asosiy) bazada
    saqlanadi va hech qachon boshqa bazaga ko'chirilmaydi.
    """

    name = models.CharField(max_length=150, verbose_name="Baza nomi")
    db_name = models.CharField(
        max_length=63, unique=True, verbose_name="PostgreSQL bazasi nomi"
    )
    is_active = models.BooleanField(default=False, verbose_name="Faol")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Yaratilgan vaqti")
    closed_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Yopilgan vaqti"
    )

    class Meta:
        verbose_name = "Baza"
        verbose_name_plural = "Bazalar"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.db_name})"

    @property
    def is_closed(self) -> bool:
        return self.closed_at is not None
