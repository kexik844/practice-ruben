from datetime import timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from .models import Category, Service, ServiceRequest


class CatalogAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.cat = Category.objects.create(name='Ремонт')
        cls.other = Category.objects.create(name='Дизайн')
        for i in range(7):
            Service.objects.create(category=cls.cat, name=f'Ремонт {i}',
                                   description='Компьютер', price=(7-i)*100,
                                   duration_minutes=30)
        cls.available = Service.objects.filter(category=cls.cat).first()
        cls.hidden = Service.objects.create(category=cls.other, name='Скрытая',
                                            description='Тест', price=50,
                                            duration_minutes=30, is_available=False)
        cls.admin = get_user_model().objects.create_user('staff', is_staff=True)
        cls.user = get_user_model().objects.create_user('client')

    def payload(self, **overrides):
        return {'service': self.available.pk, 'client_name': 'Тестовый клиент',
                'phone': '+70000000000',
                'desired_at': (timezone.now()+timedelta(days=1)).isoformat(), **overrides}

    def post_request(self, **overrides):
        return self.client.post(reverse('servicerequest-list'), self.payload(**overrides), format='json')

    def test_public_list(self):
        response = self.client.get(reverse('service-list'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 7)
        self.assertTrue(all(s['is_available'] for s in response.data['results']))
        self.assertEqual(self.client.get(reverse('category-list')).status_code, 200)
        self.assertEqual(self.client.get(reverse('service-detail', args=[self.hidden.pk])).status_code, 404)

    def test_pagination(self):
        url = reverse('service-list')
        first = self.client.get(url).data
        second = self.client.get(url, {'page': 2}).data
        self.assertEqual(len(first['results']), 5)
        self.assertEqual(len(second['results']), 2)
        self.assertTrue(first['next'])
        self.assertIsNone(second['next'])
        self.assertEqual(len(self.client.get(url, {'page_size':10}).data['results']), 7)

    def test_sorting(self):
        for order in ('price', '-price'):
            response = self.client.get(reverse('service-list'), {'ordering': order, 'page_size':10})
            self.assertEqual(response.status_code, 200)
            prices = [Decimal(s['price']) for s in response.data['results']]
            self.assertEqual(prices, sorted(prices, reverse=order.startswith('-')))

    def test_combined_filter(self):
        response = self.client.get(reverse('service-list'), {'category':self.cat.pk,
                                   'is_available':'true', 'min_price':200,'max_price':400})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 3)
        self.assertEqual(self.client.get(reverse('service-list'), {'is_available':'false'}).data['count'], 0)

    def test_search_and_nested_route(self):
        response = self.client.get(reverse('category-services', args=[self.cat.pk]), {'search':'Компьютер', 'min_price':500})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 3)
        self.assertEqual(response.data['results'][0]['category_name'], self.cat.name)
        detail = self.client.get(reverse('service-detail', args=[self.available.pk]))
        self.assertEqual(detail.data['category_name'], self.cat.name)

    def test_valid_request_server_status(self):
        response = self.post_request(status='completed')
        self.assertEqual(response.status_code, 201)
        obj = ServiceRequest.objects.get(pk=response.data['id'])
        self.assertEqual(obj.status, 'new')

    def test_past_date(self):
        response = self.post_request(desired_at=(timezone.now()-timedelta(days=1)).isoformat())
        self.assertEqual(response.status_code, 400)
        self.assertIn('desired_at', response.data)
        self.assertFalse(ServiceRequest.objects.exists())

    def test_unavailable_service(self):
        response = self.post_request(service=self.hidden.pk)
        self.assertEqual(response.status_code, 400)
        self.assertIn('service', response.data)
        self.assertFalse(ServiceRequest.objects.exists())

    def test_anonymous_price_change(self):
        url = reverse('service-detail', args=[self.available.pk])
        response = self.client.patch(url, {'price':1}, format='json')
        self.assertIn(response.status_code, (401,403))
        self.available.refresh_from_db()
        self.assertEqual(self.available.price, Decimal('700'))

    def test_blank_phone(self):
        for phone in ('', '   ', '---', None):
            with self.subTest(phone=phone):
                response = self.post_request(phone=phone)
                self.assertEqual(response.status_code, 400)
                self.assertIn('phone', response.data)
        self.assertFalse(ServiceRequest.objects.exists())

    def test_nonexistent_service_id(self):
        data = self.payload(); data.pop('service'); data['service_id'] = 999999
        response = self.client.post(reverse('servicerequest-list'), data, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(ServiceRequest.objects.exists())

    def test_service_id_alias(self):
        data = self.payload(); data['service_id'] = data.pop('service')
        response = self.client.post(reverse('servicerequest-list'), data, format='json')
        self.assertEqual(response.status_code, 201)

    def test_invalid_query_parameters(self):
        cases = [{'category':'abc'}, {'category':999999}, {'is_available':'maybe'},
                 {'min_price':'abc'}, {'min_price':'NaN'}, {'max_price':-1},
                 {'min_price':500,'max_price':100}, {'ordering':'name'},
                 {'page':'x'}, {'page':0}, {'page_size':11}, {'typo':'1'}]
        for query in cases:
            with self.subTest(query=query):
                self.assertEqual(self.client.get(reverse('service-list'), query).status_code, 400)
        self.assertEqual(self.client.get(reverse('service-list'), {'page':999}).status_code, 404)

    def test_admin_crud_and_validation(self):
        self.client.force_authenticate(self.admin)
        url = reverse('service-detail', args=[self.available.pk])
        self.assertEqual(self.client.patch(url, {'price':-1}, format='json').status_code, 400)
        self.assertEqual(self.client.patch(url, {'duration_minutes':0}, format='json').status_code, 400)
        self.assertEqual(self.client.patch(url, {'price':0}, format='json').status_code, 200)
        self.assertEqual(self.client.get(reverse('service-list')).data['count'], 8)
        result = self.client.post(reverse('category-list'), {'name':'Новая категория'}, format='json')
        self.assertEqual(result.status_code, 201)
        cat_id = result.data['id']
        result = self.client.post(reverse('service-list'), {'category':cat_id,'name':'Новая услуга',
                          'description':'Описание','price':'10.00','duration_minutes':5},format='json')
        self.assertEqual(result.status_code, 201)
        self.assertEqual(self.client.delete(reverse('category-detail', args=[cat_id])).status_code, 409)
        self.assertEqual(self.client.delete(reverse('service-detail', args=[result.data['id']])).status_code, 204)
        self.assertEqual(self.client.delete(reverse('category-detail', args=[cat_id])).status_code, 204)

    def test_request_privacy_and_status(self):
        response = self.post_request()
        url = reverse('servicerequest-detail', args=[response.data['id']])
        self.assertIn(self.client.get(url).status_code, (401,403))
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.patch(url, {'status':'confirmed'}, format='json').status_code,403)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.patch(url, {'status':'invalid'}, format='json').status_code,400)
        self.assertEqual(self.client.patch(url, {'status':'confirmed'}, format='json').status_code,200)
        self.assertEqual(self.client.delete(url).status_code,204)

    def test_no_n_plus_one(self):
        with self.assertNumQueries(2): # COUNT + SELECT JOIN; anonymous request
            response = self.client.get(reverse('service-list'))
            self.assertEqual(response.status_code, 200)

    def test_browsable_category_list(self):
        response = self.client.get(reverse('category-list'), HTTP_ACCEPT='text/html')
        self.assertEqual(response.status_code, 200)
        self.assertIn('text/html', response['Content-Type'])

    def test_browsable_category_services(self):
        url = reverse('category-services', args=[self.cat.pk])
        response = self.client.get(url, {'min_price': 500}, HTTP_ACCEPT='text/html')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 3)
        self.assertIn('text/html', response['Content-Type'])
