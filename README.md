# Каталог услуг

Учебная практика УП.05 · ГАПОУ «Альметьевский политехнический техникум»  
Задание №1 — Django REST API (24.11.2026)  
Задание №2 — React и CRUD (25.11.2026)

Приложение для просмотра услуг, оформления заявок и управления каталогом. Клиентская часть написана на React с JSX и Vite. Серверная часть — Django REST Framework и SQLite. Данные каталога загружаются из API.

## Возможности

- Каталог услуг: категория, цена, продолжительность, доступность.
- Одновременные серверные фильтры, поиск с задержкой 400 мс, сортировка и пагинация.
- Динамический маршрут `/services/:id` и форма заявки с серверной валидацией.
- Управление услугами: создание, просмотр, редактирование и удаление (CRUD).
- Авторизация администратора Django, состояния загрузки, ошибки и повтор запросов.
- Избранное в localStorage без персональных данных.
- Адаптивный интерфейс для 390 и 1280 px.

## Структура

```text
practice-ruben/
├── backend/
│   ├── backend/             Настройки Django
│   ├── catalog/             Модели, сериализаторы, API, миграции, тесты
│   ├── manage.py
│   ├── requirements.txt
│   ├── API.md
│   └── TEST_RESULTS.md
├── frontend/
│   ├── src/
│   │   ├── api/             HTTP-клиент
│   │   ├── components/      Повторно используемые компоненты JSX
│   │   ├── hooks/           Загрузка, debounce и избранное
│   │   ├── pages/           Пять страниц React
│   │   ├── main.jsx         Маршрутизация
│   │   └── styles.css
│   ├── tests/               Восемь тестов Playwright
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── docs/                    Отчёт и инструкция демонстрации
└── README.md
```

## 1. Запуск backend

Требуется Python 3.11+ и Node.js 20.19+ (рекомендуется 22+).

```powershell
git clone https://github.com/kexik844/practice-ruben.git
cd practice-ruben
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py seed_catalog
.\.venv\Scripts\python.exe manage.py createsuperuser
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

Для Linux/macOS вместо `.\.venv\Scripts\python.exe` используйте `.venv/bin/python`.

Команда `seed_catalog` на пустой базе создаёт 4 категории, 15 услуг и 8 тестовых заявок. При создании superuser придумайте собственный логин и пароль. Если нужен собственный SECRET_KEY, скопируйте `backend/.env.example` в `backend/.env` и замените значение. Реальные секреты, база и виртуальное окружение не включаются в Git.

- API: http://127.0.0.1:8000/api/
- Документация: [backend/API.md](backend/API.md)
- Django admin: http://127.0.0.1:8000/admin/

## 2. Запуск frontend

Откройте второй терминал в корне репозитория:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

На Linux/macOS вместо Copy-Item используйте `cp .env.example .env`.

Откройте http://127.0.0.1:5173/. Оба терминала должны оставаться запущенными.

Vite проксирует запросы `/api/` к Django. Адреса настраиваются в `frontend/.env`. После изменения .env перезапустите Vite. Для проверки сборки выполните `npm run build`.

## Страницы

| Маршрут | Назначение |
|---|---|
| `/` | Каталог и фильтрация |
| `/services/:id` | Карточка услуги |
| `/request` | Оставить заявку |
| `/manage` | Управление каталогом |
| `/favorites` | Избранные услуги |

Для управления используйте логин и пароль Django superuser. HTTP Basic Authentication применяется для локального учебного запуска; данные авторизации хранятся в памяти страницы. При внешнем развёртывании требуются HTTPS, настройка обратного прокси и SPA fallback на index.html. Недоступные услуги скрыты от гостей по правилам Django API.

## 3. Проверка

В папке backend:

```powershell
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py makemigrations --check --dry-run
.\.venv\Scripts\python.exe manage.py test catalog -v 2
```

В папке frontend, при запущенном Django и свежей учебной базе:

```powershell
npx playwright install chromium
$env:TEST_ADMIN_USER = "admin"
$env:TEST_ADMIN_PASSWORD = Read-Host "Пароль тестового администратора"
npm run test:e2e
Remove-Item Env:TEST_ADMIN_PASSWORD
```

Укажите собственное имя администратора. Тесты создают заявку и временную услугу, поэтому запускайте их только на учебной базе. При выполнении Playwright сохраняет скриншоты каталога, карточки, формы заявки, мобильной версии и управления в `docs/screenshots/`.

- [Сценарии и отчёт о проверке](docs/TEST_REPORT.md)
- [Порядок демонстрации преподавателю](docs/DEMO.md)
- [GitHub Actions](https://github.com/kexik844/practice-ruben/actions)

Статус: восемь сценариев ранее прошли в браузере с тестовыми ответами API. Проверка с настоящим Django должна быть подтверждена успешным запуском Playwright, а не предварительными скриншотами. В GitHub Actions предусмотрена автоматическая проверка на чистой учебной базе.

## История Git

Сохранена история задания №1. Задание №2 разделено на отдельные коммиты: перенос backend, реализация React JSX, тесты и документация. Исходные файлы Django перенесены без изменения их содержимого, кроме актуализации инструкции запуска.
