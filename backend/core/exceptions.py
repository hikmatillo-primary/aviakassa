from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from django.db.models import ProtectedError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    """
    DRF standart handlerini kengaytiradi:
    - ProtectedError: bog'langan yozuvni o'chirishga urinilganda 400 qaytaradi (500 emas).
    - Django ValidationError: model darajasidagi xatolarni 400 ga aylantiradi.
    - IntegrityError: DB cheklovlarini 400 ga aylantiradi.
    """
    if isinstance(exc, ProtectedError):
        return Response(
            {
                "detail": (
                    "Bu yozuvni o'chirib bo'lmaydi: u boshqa yozuvlar bilan "
                    "bog'langan (partiyalar, sotuvlar yoki to'lovlar mavjud)."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if isinstance(exc, IntegrityError):
        return Response(
            {"detail": "Ma'lumotlar bazasi cheklovi buzildi. Kiritilgan qiymatlarni tekshiring."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if isinstance(exc, DjangoValidationError):
        message_dict = getattr(exc, "message_dict", None)
        if message_dict:
            return Response(message_dict, status=status.HTTP_400_BAD_REQUEST)
        messages = getattr(exc, "messages", None) or [str(exc)]
        return Response({"detail": messages}, status=status.HTTP_400_BAD_REQUEST)

    return exception_handler(exc, context)
