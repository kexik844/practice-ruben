from decimal import Decimal, InvalidOperation
from django_filters import rest_framework as django_filters
from rest_framework.exceptions import ValidationError
from .models import Category, Service


class ServiceFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')

    class Meta:
        model = Service
        fields = ['category', 'is_available']


def validate_query(request, service_filters=False):
    """Reject invalid values instead of silently ignoring them."""
    params = request.query_params
    allowed = {'page', 'page_size', 'format'}
    if service_filters:
        allowed |= {'category', 'is_available', 'min_price', 'max_price', 'search', 'ordering'}
    errors = {}
    for key in params:
        if key not in allowed:
            errors[key] = 'Неизвестный параметр.'
        elif len(params.getlist(key)) != 1:
            errors[key] = 'Укажите одно значение.'
    for key in ('page', 'page_size'):
        if key in params:
            try:
                value = int(params[key])
                if value < 1 or (key == 'page_size' and not 5 <= value <= 10):
                    raise ValueError
            except ValueError:
                errors[key] = 'Укажите целое положительное число' + (' от 5 до 10.' if key == 'page_size' else '.')
    if service_filters:
        if 'category' in params:
            try:
                pk = int(params['category'])
                if not 0 < pk <= 2**63-1 or not Category.objects.filter(pk=pk).exists():
                    raise ValueError
            except ValueError:
                errors['category'] = 'Укажите ID существующей категории.'
        if 'is_available' in params and params['is_available'].lower() not in ('true', 'false'):
            errors['is_available'] = 'Допустимы true или false.'
        prices = {}
        for key in ('min_price', 'max_price'):
            if key in params:
                try:
                    value = Decimal(params[key])
                    if not value.is_finite() or value < 0 or value > Decimal('99999999.99'):
                        raise ValueError
                    prices[key] = value
                except (InvalidOperation, ValueError):
                    errors[key] = 'Укажите неотрицательную цену до 99999999.99.'
        if len(prices) == 2 and prices['min_price'] > prices['max_price']:
            errors['max_price'] = 'Максимальная цена меньше минимальной.'
        if 'ordering' in params and params['ordering'] not in ('price', '-price'):
            errors['ordering'] = 'Допустимы price или -price.'
    if errors:
        raise ValidationError(errors)
