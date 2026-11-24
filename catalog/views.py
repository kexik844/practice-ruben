from django.db.models.deletion import ProtectedError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.exceptions import APIException
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from .filters import ServiceFilter, validate_query
from .models import Category, Service, ServiceRequest
from .permissions import IsAdminOrReadOnly
from .serializers import (CategorySerializer, ServiceSerializer,
                          ServiceRequestSerializer, ServiceRequestCreateSerializer)


class Conflict(APIException):
    status_code = 409
    default_detail = 'Объект связан с другими записями и не может быть удалён.'


class ProtectedDeleteMixin:
    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError as exc:
            raise Conflict() from exc


class ServiceQueryMixin:
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ServiceFilter
    search_fields = ['name', 'description']
    ordering_fields = ['price']
    ordering = ['id']

    def filter_services(self, queryset):
        validate_query(self.request, service_filters=True)
        for backend in ServiceQueryMixin.filter_backends:
            queryset = backend().filter_queryset(self.request, queryset, self)
        # Stable pagination when prices match.
        ordering = self.request.query_params.get('ordering')
        return queryset.order_by(ordering, 'id') if ordering else queryset.order_by('id')


class CategoryViewSet(ProtectedDeleteMixin, ServiceQueryMixin, ModelViewSet):
    queryset = Category.objects.all().order_by('id')
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    # The browsable API renders filters against Category, not Service.
    # Nested services are filtered explicitly by filter_services().
    filter_backends = []

    def filter_queryset(self, queryset):
        return queryset

    def list(self, request, *args, **kwargs):
        validate_query(request)
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def services(self, request, pk=None):
        category = self.get_object()
        queryset = category.services.select_related('category').order_by('id')
        if not request.user.is_staff:
            queryset = queryset.filter(is_available=True)
        # Reuse the same service filtering configuration in the nested route.
        queryset = self.filter_services(queryset)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ServiceSerializer(page, many=True, context=self.get_serializer_context())
            return self.get_paginated_response(serializer.data)
        return Response(ServiceSerializer(queryset, many=True).data)

class ServiceViewSet(ProtectedDeleteMixin, ServiceQueryMixin, ModelViewSet):
    queryset = Service.objects.select_related('category').order_by('id')
    serializer_class = ServiceSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        if self.request.user.is_staff:
            return self.queryset.all()
        return self.queryset.filter(is_available=True)

    def filter_queryset(self, queryset):
        if self.action == 'list':
            return self.filter_services(queryset)
        return queryset


class ServiceRequestViewSet(ModelViewSet):
    queryset = ServiceRequest.objects.select_related('service').order_by('id')
    serializer_class = ServiceRequestSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAdminUser()]

    def list(self, request, *args, **kwargs):
        validate_query(request)
        return super().list(request, *args, **kwargs)

    def get_serializer_class(self):
        if self.action == 'create':
            return ServiceRequestCreateSerializer
        return ServiceRequestSerializer

    def perform_create(self, serializer):
        serializer.save(status='new')
