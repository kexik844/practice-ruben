from rest_framework import serializers
from django.utils import timezone
from .models import Category, Service, ServiceRequest


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ('id', 'slug')


class ServiceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source='category.name',
        read_only=True
    )

    class Meta:
        model = Service
        fields = '__all__'
        read_only_fields = ('id', 'created_at')


class ServiceRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRequest
        fields = '__all__'
        read_only_fields = ('id', 'created_at')


class ServiceRequestCreateSerializer(ServiceRequestSerializer):
    class Meta(ServiceRequestSerializer.Meta):
        read_only_fields = ('id', 'created_at', 'status')

    def to_internal_value(self, data):
        # Accept service_id as an alias for the existing service field.
        if 'service_id' in data:
            data = data.copy()
            if 'service' in data and str(data['service']) != str(data['service_id']):
                raise serializers.ValidationError({'service_id': 'ID услуги не совпадают.'})
            data['service'] = data['service_id']
        return super().to_internal_value(data)

    def validate_service(self, value):
        if not value.is_available:
            raise serializers.ValidationError(
                'Данная услуга недоступна.'
            )
        return value

    def validate_desired_at(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError(
                'Дата и время должны быть в будущем.'
            )
        return value

    def validate_phone(self, value):
        phone = value.replace(' ', '').replace('-', '')
        phone = phone.replace('(', '').replace(')', '')
        digits = phone.removeprefix('+')

        if not digits.isascii() or not digits.isdigit():
            raise serializers.ValidationError(
                'Некорректный номер телефона.'
            )

        if not 10 <= len(digits) <= 15:
            raise serializers.ValidationError(
                'Номер должен содержать от 10 до 15 цифр.'
            )

        return phone
