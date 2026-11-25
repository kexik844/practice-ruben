from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet,
    ServiceViewSet,
    ServiceRequestViewSet
)

router = DefaultRouter()

router.register('categories', CategoryViewSet)
router.register('services', ServiceViewSet)
router.register('requests', ServiceRequestViewSet)

urlpatterns = router.urls