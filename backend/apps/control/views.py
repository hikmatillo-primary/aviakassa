import logging

from django.core.exceptions import ObjectDoesNotExist
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from . import services
from .models import DatabaseRegistry

logger = logging.getLogger(__name__)


def _serialize(registry: DatabaseRegistry) -> dict:
    return {
        "id": registry.id,
        "name": registry.name,
        "dbName": registry.db_name,
        "isActive": registry.is_active,
        "isClosed": registry.is_closed,
        "createdAt": registry.created_at,
        "closedAt": registry.closed_at,
    }


def _list_registries():
    return DatabaseRegistry.objects.using(services.DEFAULT_ALIAS).all()


@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def databases(request):
    if request.method == "GET":
        items = [_serialize(obj) for obj in _list_registries()]
        active = next((item["id"] for item in items if item["isActive"]), None)
        return Response({"databases": items, "activeId": active})

    name = (request.data.get("name") or "").strip()
    if not name:
        return Response(
            {"name": ["Baza nomi majburiy."]}, status=status.HTTP_400_BAD_REQUEST
        )

    copy = request.data.get("copy") or {}
    if not isinstance(copy, dict):
        return Response(
            {"copy": ["Noto'g'ri format."]}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        result = services.create_database(name, copy)
    except services.DatabaseError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    return Response(
        {
            "database": _serialize(result["database"]),
            "copied": result["copied"],
            "detail": "Yangi baza yaratildi.",
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([IsAdminUser])
def activate_database(request, pk: int):
    try:
        registry = services.activate_database(pk)
    except ObjectDoesNotExist:
        return Response(
            {"detail": "Baza topilmadi."}, status=status.HTTP_404_NOT_FOUND
        )
    return Response({"database": _serialize(registry), "detail": "Baza faollashtirildi."})


@api_view(["POST"])
@permission_classes([IsAdminUser])
def close_database(request, pk: int):
    try:
        registry = services.close_database(pk)
    except ObjectDoesNotExist:
        return Response(
            {"detail": "Baza topilmadi."}, status=status.HTTP_404_NOT_FOUND
        )
    return Response({"database": _serialize(registry), "detail": "Baza yopildi."})


@api_view(["POST", "DELETE"])
@permission_classes([IsAdminUser])
def delete_database(request, pk: int):
    """Bazani o'chirish (joriy parolni tekshirish bilan)."""
    password = request.data.get("password") or request.query_params.get("password")
    if not password:
        return Response(
            {"password": ["Bazani o'chirish uchun joriy parolingizni kiriting."]},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not request.user.check_password(str(password)):
        return Response(
            {"password": ["Parol noto'g'ri kiritildi."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        name = services.delete_database(pk)
    except ObjectDoesNotExist:
        return Response(
            {"detail": "Baza topilmadi."}, status=status.HTTP_404_NOT_FOUND
        )
    except services.DatabaseError as exc:
        return Response(
            {"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST
        )

    return Response({"detail": f'"{name}" bazasi muvaffaqiyatli o\'chirildi.'})

