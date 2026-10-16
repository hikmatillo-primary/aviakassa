import contextvars

# Har bir so'rov uchun faol baza aliasini saqlaydi. Middleware tomonidan
# o'rnatiladi, so'rov tugagach tozalanadi. Standart holatda `default`.
_active_alias_var = contextvars.ContextVar("active_db_alias", default="default")


def get_active_alias() -> str:
    return _active_alias_var.get()


def set_active_alias(alias: str):
    return _active_alias_var.set(alias)


def reset_active_alias(token) -> None:
    try:
        _active_alias_var.reset(token)
    except (ValueError, LookupError):
        pass
