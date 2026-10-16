import logging

from .db_state import reset_active_alias, set_active_alias

logger = logging.getLogger(__name__)


class ActiveDatabaseMiddleware:
    """
    Har bir so'rov uchun faol bazani aniqlaydi va contextvar orqali router'ga
    yetkazadi. Baza aniqlanmasa — `default`ga qaytamiz (xatoga chidamli).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        alias = "default"
        try:
            from apps.control.services import resolve_active_alias

            alias = resolve_active_alias()
        except Exception as exc:  # pragma: no cover - himoyaviy
            logger.warning("Faol bazani aniqlashda xato: %s", exc)

        token = set_active_alias(alias)
        try:
            return self.get_response(request)
        finally:
            reset_active_alias(token)
