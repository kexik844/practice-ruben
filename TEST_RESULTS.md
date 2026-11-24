# Результаты фактической проверки

Выполнено в Python 3.13.5 с пакетами из предоставленного виртуального окружения (Django 5.2.19, DRF 3.18.3 и django-filter 26.2). Установка зависимостей из интернета отдельно не проверялась.

## API-тесты

Команда: `python manage.py test catalog -v 2`.


```text
test_admin_crud_and_validation (catalog.tests.CatalogAPITests.test_admin_crud_and_validation) ... ok
test_anonymous_price_change (catalog.tests.CatalogAPITests.test_anonymous_price_change) ... ok
test_blank_phone (catalog.tests.CatalogAPITests.test_blank_phone) ... ok
test_combined_filter (catalog.tests.CatalogAPITests.test_combined_filter) ... ok
test_invalid_query_parameters (catalog.tests.CatalogAPITests.test_invalid_query_parameters) ... ok
test_no_n_plus_one (catalog.tests.CatalogAPITests.test_no_n_plus_one) ... ok
test_nonexistent_service_id (catalog.tests.CatalogAPITests.test_nonexistent_service_id) ... ok
test_pagination (catalog.tests.CatalogAPITests.test_pagination) ... ok
test_past_date (catalog.tests.CatalogAPITests.test_past_date) ... ok
test_public_list (catalog.tests.CatalogAPITests.test_public_list) ... ok
test_request_privacy_and_status (catalog.tests.CatalogAPITests.test_request_privacy_and_status) ... ok
test_search_and_nested_route (catalog.tests.CatalogAPITests.test_search_and_nested_route) ... ok
test_service_id_alias (catalog.tests.CatalogAPITests.test_service_id_alias) ... ok
test_sorting (catalog.tests.CatalogAPITests.test_sorting) ... ok
test_unavailable_service (catalog.tests.CatalogAPITests.test_unavailable_service) ... ok
test_valid_request_server_status (catalog.tests.CatalogAPITests.test_valid_request_server_status) ... ok
Ran 16 tests in 0.124s
OK
System check identified no issues (0 silenced).
```

Итого: 16 тестов, 0 ошибок, 0 падений. Тест N+1 проверяет ровно два запроса для анонимного списка: COUNT и SELECT с JOIN.

## Запуск на новой SQLite-базе

- `migrate --noinput`: все миграции успешно применены.
- `seed_catalog`: 4 категории, 15 услуг, 8 заявок; повторный запуск — те же количества.
- `check`: 0 ошибок.
- `makemigrations --check --dry-run`: No changes detected.
- Реальный HTTP-сервер `runserver` запущен на 127.0.0.1:8765; проверены следующие запросы:

| Запрос | Фактический результат |
|---|---|
| GET /api/categories/ | 200, count=4 |
| GET /api/services/?ordering=price&page_size=10 | 200, count=15 |
| GET /api/categories/1/services/ | 200, count=4 |
| GET /api/services/1/ | 200 |
| GET /admin/login/ | 200 |
| POST /api/requests/ | 201, status=new (передан completed) |

Последний POST выполнен на отдельной временной базе и не изменил исходные данные или демонстрационный набор.

## Повторная проверка после исправления HTML-интерфейса DRF

Воспроизведён AssertionError при запросах списка категорий и услуг категории с Accept: text/html. Добавлены два регрессионных теста; до исправления оба падали. Автоматическая HTML-форма фильтров для CategoryViewSet отключена, а фильтрация вложенного списка услуг по query-параметрам сохранена.

Команда: `python manage.py test catalog -v 1`.

```text
Ran 18 tests in 0.094s
OK
System check identified no issues (0 silenced).
```

Все 18 тестов прошли. Дополнительно выполнен `python manage.py check`: ошибок нет.
