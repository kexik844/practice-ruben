from django.contrib import admin
from .models import Category, Service, ServiceRequest


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug')
    search_fields = ('name', 'slug')
    readonly_fields = ('slug',)


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'name',
        'category',
        'price',
        'duration_minutes',
        'is_available',
        'created_at',
    )
    list_filter = ('category', 'is_available')
    search_fields = ('name', 'description')
    list_editable = ('price', 'is_available')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'service',
        'client_name',
        'phone',
        'desired_at',
        'status',
        'created_at',
    )
    list_filter = ('status', 'service', 'created_at')
    search_fields = ('client_name', 'phone')
    list_editable = ('status',)
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)