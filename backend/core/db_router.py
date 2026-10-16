from .db_state import get_active_alias

# Biznes ma'lumotlarini saqlaydigan ilovalar. Faqat shu ilovalar faol bazaga
# yo'naltiriladi; qolganlari (auth, admin, control, ...) har doim `default`da.
BUSINESS_APPS = {"partners", "flights", "sales", "cash"}

DEFAULT_ALIAS = "default"
CONTROL_APP = "control"


class AviakassaRouter:
    """Faol bazani biznes modellariga yo'naltiruvchi router."""

    def db_for_read(self, model, **hints):
        if model._meta.app_label in BUSINESS_APPS:
            return get_active_alias()
        return DEFAULT_ALIAS

    def db_for_write(self, model, **hints):
        if model._meta.app_label in BUSINESS_APPS:
            return get_active_alias()
        return DEFAULT_ALIAS

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        # Registry faqat asosiy bazada; qolgan ilovalar har bir bazada yaratiladi.
        if app_label == CONTROL_APP:
            return db == DEFAULT_ALIAS
        return True
