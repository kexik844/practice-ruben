from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator

class Category(models.Model):
    name = models.CharField(max_length=100, verbose_name='Название категории', null=False)
    slug = models.SlugField(max_length=120, unique=True, blank=True, allow_unicode=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name, allow_unicode=True) or "category"
            self.slug = base_slug
            counter = 1

            while Category.objects.filter(
                slug = self.slug
            ).exclude(pk=self.pk).exists():
                self.slug = f"{base_slug}-{counter}"
                counter+=1

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
    
class Service(models.Model):
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='services', null=False)
    name = models.CharField(max_length=200, verbose_name='Название услуги', null=False)
    description = models.TextField(verbose_name='Описание услуги', null=False)
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Стоимость услуги', validators=[MinValueValidator(0)], null=False)
    duration_minutes = models.PositiveIntegerField(verbose_name='Продолжительность в минутах', validators=[MinValueValidator(1)], null=False)
    is_available = models.BooleanField(verbose_name='Доступность услуги', default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=False)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=models.Q(price__gte=0), name='service_price_nonnegative'),
            models.CheckConstraint(condition=models.Q(duration_minutes__gt=0), name='service_duration_positive'),
        ]

    def __str__(self):
        return self.name

class ServiceRequest(models.Model):
    STATUSES = [
        ('new', 'Новая'),
        ('confirmed', 'Подтверждённая'),
        ('completed', 'Выполненная'),
        ('cancelled', 'Отменённая'),
    ]

    service = models.ForeignKey(Service, on_delete=models.PROTECT, related_name='requests', null=False)
    client_name = models.CharField(verbose_name='Имя клиента', max_length=150, null=False)
    phone = models.CharField(verbose_name='Номер телефона', max_length=20, null=False)
    desired_at = models.DateTimeField(verbose_name='Желаемая дата и время', null=False)
    status = models.CharField(choices=STATUSES, verbose_name='Статус заявки', default='new', max_length=20, null=False)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата и время создания заявки')

    class Meta:
        constraints = [models.CheckConstraint(condition=models.Q(status__in=['new', 'confirmed', 'completed', 'cancelled']), name='request_valid_status')]

    def __str__(self):
        return f'Заявка: {self.client_name} - {self.phone}'
    

