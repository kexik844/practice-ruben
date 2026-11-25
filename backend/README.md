# Каталог услуг — Django REST API

Учебный backend проекта: категории, услуги и заявки. Приложение `catalog`, проект `backend`, SQLite. Публичный каталог и создание заявок; управление данными — для сотрудников (`is_staff`).

## Запуск с нуля

Python 3.11+ и Git. Склонируйте репозиторий и перейдите в каталог проекта:

```bash
git clone https://github.com/kexik844/practice-ruben.git
cd practice-ruben
```

Далее в корне проекта:

```bash
python -m venv .venv
# Linux/macOS:
source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py seed_catalog
python manage.py createsuperuser
python manage.py runserver
```

Для локального запуска предусмотрен тестовый SECRET_KEY. Для собственного ключа скопируйте `.env.example` в `.env` и замените SECRET_KEY; для внешнего развёртывания задайте `DEBUG=0`, корректные `ALLOWED_HOSTS` и отдельный секрет. Не публикуйте `.env`, SQLite-файл или виртуальное окружение.

- API: http://127.0.0.1:8000/api/
- Услуги: http://127.0.0.1:8000/api/services/
- Админка: http://127.0.0.1:8000/admin/
- Вход в browsable API: http://127.0.0.1:8000/api-auth/login/

`seed_catalog` на пустой базе создаёт 4 категории, 15 услуг и 8 демонстрационных заявок. Повторный запуск с неизменёнными демо-записями не создаёт дубликатов; существующие данные не удаляются. База данных и пароль администратора из исходного архива намеренно не распространяются.

## Миграции и тесты

```bash
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py migrate
python manage.py test catalog -v 2
```

Тесты используют отдельную временную базу; наличие демо-данных не требуется. Проверяются список, пагинация, сортировка, фильтры, поиск, вложенный маршрут, валидация заявок, приватность, CRUD и количество SQL-запросов. См. `TEST_RESULTS.md` и `API.md`.

## Git

Репозиторий: https://github.com/kexik844/practice-ruben. Основная ветка — `main`. История изменений содержит отдельные коммиты настройки Git, серверной валидации, тестов и документации.

```bash
git log --oneline
git remote -v
```

Исходные `.env`, `db.sqlite3` и `__pycache__` не включены в новый репозиторий. Если старый секрет уже попадал в другой удалённый репозиторий, его необходимо заменить.
