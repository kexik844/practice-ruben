from datetime import timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from catalog.models import Category, Service, ServiceRequest


DATA = {
    'Ремонт техники': [
        ('Ремонт ПК', 'Ремонт компьютера', 1500, 60),
        ('Ремонт ноутбука', 'Ремонт ноутбука', 2000, 90),
        ('Чистка ПК', 'Удаление пыли', 1000, 45),
        ('Установка Windows', 'Установка системы', 1200, 60),
    ],
    'Веб-разработка': [
        ('Лендинг', 'Одностраничный сайт', 15000, 480),
        ('Интернет-магазин', 'Разработка магазина', 45000, 1440),
        ('Telegram-бот', 'Разработка бота', 10000, 240),
        ('Разработка API', 'Создание REST API', 12000, 360),
    ],
    'Дизайн': [
        ('Логотип', 'Разработка логотипа', 3000, 120),
        ('Баннер', 'Создание баннера', 1500, 60),
        ('UI/UX дизайн', 'Дизайн интерфейса', 8000, 240),
        ('Визитка', 'Дизайн визитной карточки', 1000, 30),
    ],
    'IT-консультации': [
        ('Подбор ПК', 'Подбор комплектующих', 1000, 60),
        ('Настройка сети', 'Настройка сети', 2000, 90),
        ('Консультация', 'Консультация специалиста', 0, 30),
    ],
}


class Command(BaseCommand):
    help = 'Добавляет демонстрационные категории, услуги и заявки без дублирования.'

    @transaction.atomic
    def handle(self, *args, **options):
        services = []
        for category_name, rows in DATA.items():
            category, _ = Category.objects.get_or_create(name=category_name)
            for name, description, price, duration in rows:
                service, _ = Service.objects.get_or_create(
                    category=category, name=name,
                    defaults={'description': description, 'price': price,
                              'duration_minutes': duration, 'is_available': True},
                )
                services.append(service)
        statuses = ['new', 'confirmed', 'completed', 'cancelled']
        for i in range(8):
            ServiceRequest.objects.get_or_create(
                service=services[i * 2], phone=f'+700000000{i:02d}',
                defaults={'client_name': f'Тестовый клиент {i+1}',
                          'desired_at': timezone.now() + timedelta(days=i+1),
                          'status': statuses[i % 4]},
            )
        self.stdout.write(self.style.SUCCESS(
            f'Категории: {Category.objects.count()}, услуги: {Service.objects.count()}, заявки: {ServiceRequest.objects.count()}'
        ))
