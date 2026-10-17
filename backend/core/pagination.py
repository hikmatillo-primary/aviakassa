from rest_framework.pagination import PageNumberPagination


class AviakassaPagination(PageNumberPagination):
    """Sahifa hajmini so'rovda belgilash imkoniyati.

    Frontend butun ro'yxatni bitta so'rovda oladi (`?page_size=2000`), shuning
    uchun 100 talik sahifalab yurish shart emas.
    """

    page_size = 100
    page_size_query_param = "page_size"
    max_page_size = 5000
