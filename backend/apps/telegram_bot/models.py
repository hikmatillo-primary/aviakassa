from django.db import models


class BotGroup(models.Model):
    """Bot a'zo/admin bo'lgan Telegram guruhlar (my_chat_member yangilanishidan yoziladi)."""
    chat_id = models.BigIntegerField(unique=True, verbose_name="Guruh chat ID")
    title = models.CharField(max_length=255, blank=True, default="", verbose_name="Guruh nomi")
    is_admin = models.BooleanField(default=False, verbose_name="Bot adminmi")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Yangilangan vaqti")

    class Meta:
        verbose_name = "Telegram guruh"
        verbose_name_plural = "Telegram guruhlar"
        ordering = ["id"]

    def __str__(self):
        return f"{self.title or self.chat_id} ({'admin' if self.is_admin else 'aʼzo'})"
