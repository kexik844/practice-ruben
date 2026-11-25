import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const screenshots = '../docs/screenshots';
const admin = {
  username: process.env.TEST_ADMIN_USER || 'admin',
  password: process.env.TEST_ADMIN_PASSWORD || ''
};
const future = () => {
  const d = new Date(Date.now() + 86400000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

async function catalog(page) {
  await page.goto('/');
  await expect(page.locator('.service-card').first()).toBeVisible();
}

async function login(page) {
  test.skip(!admin.password, 'Укажите TEST_ADMIN_PASSWORD');
  await page.goto('/manage');
  await page.getByLabel('Логин').fill(admin.username);
  await page.getByLabel('Пароль').fill(admin.password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(page.getByText(/Администратор:/)).toBeVisible();
}

async function screenshot(page, name) {
  fs.mkdirSync(screenshots, { recursive: true });
  await page.screenshot({ path: `${screenshots}/${name}.png`, fullPage: true });
}

test(
  '01 — фильтры, поиск 400 мс и сортировка одновременно',
  async ({ page }) => {
    await catalog(page);
    await screenshot(page, '01-catalog-1280');
    await page.getByLabel('Категория', { exact: true }).selectOption({ label: 'Ремонт техники' });
    await page.getByLabel('Доступность').selectOption('true');
    await page.getByLabel('Цена от, ₽').fill('1000');
    await page.getByLabel('Цена до, ₽').fill('2500');
    await page.getByLabel('Сортировка').selectOption('-price');
    const response = page.waitForResponse(r => r.url().includes('search=%D0') && r.status() === 200);
    const started = Date.now();
    await page.getByLabel('Поиск', { exact: true }).fill('Ремонт');
    const r = await response;
    expect(Date.now() - started).toBeGreaterThanOrEqual(300);
    const q = new URL(r.url()).searchParams;
    for (const [k, v] of Object.entries({
      is_available: 'true',
      min_price: '1000',
      max_price: '2500',
      ordering: '-price',
      search: 'Ремонт',
      page: '1'
    })) expect(q.get(k)).toBe(v);
    expect(q.get('category')).toBeTruthy();
    await expect(page.locator('.service-card')).toHaveCount(2);
    await expect(page.locator('.service-card').first()).toContainText('Ремонт ноутбука');
  }
);
test(
  '02 — backend-пагинация, мобильный экран, избранное',
  async ({ page }) => {
    await catalog(page);
    await page.getByRole('button', { name: 'Далее →' }).click();
    await expect(page.getByText(/Страница 2 из/)).toBeVisible();
    await expect(page.locator('.service-card').first()).toContainText('Интернет-магазин');
    await page.locator('.service-card').first().getByRole(
      'button',
      { name: 'В избранное' }
    ).click();
    await page.reload();
    await page.getByRole('link', { name: 'Избранное (1)' }).click();
    await expect(page.getByRole('heading', { name: 'Интернет-магазин' })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await catalog(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await screenshot(page, '04-catalog-390');
  }
);
test(
  '03 — карточка, обновление маршрута и несуществующий ID',
  async ({ page }) => {
    await catalog(page);
    await page.locator('.service-card').first().getByRole(
      'link',
      { name: 'Подробнее →' }
    ).click();
    await expect(page).toHaveURL(/\/services\/\d+/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ремонт ПК');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ремонт ПК');
    await screenshot(page, '02-service-1280');
    await page.goto('/services/999999');
    await expect(page.getByRole('alert')).toContainText('не найдены');
  }
);
test(
  '04 — прошедшая дата: реальный ответ 400 рядом с полем',
  async ({ page }) => {
    await page.goto('/request');
    await page.getByLabel('Услуга', { exact: true }).selectOption({ index: 1 });
    await page.getByLabel('Желаемая дата и время').fill('2020-01-01T12:00');
    await page.getByLabel('Ваше имя').fill('Тестовый клиент');
    await page.getByLabel('Телефон').fill('+70000000000');
    const response = page.waitForResponse(r => r.url().endsWith('/api/requests/') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Отправить заявку' }).click();
    expect((await response).status()).toBe(400);
    await expect(page.locator('#desired_at-error')).toContainText('будущем');
  }
);
test(
  '05 — отправка заявки, номер из ответа 201',
  async ({ page }) => {
    await page.goto('/request');
    await page.getByLabel('Услуга', { exact: true }).selectOption({ index: 1 });
    await page.getByLabel('Желаемая дата и время').fill(future());
    await page.getByLabel('Ваше имя').fill('Тест Playwright');
    await page.getByLabel('Телефон').fill('+70000000000');
    await screenshot(page, '03-request-1280');
    const response = page.waitForResponse(r => r.url().endsWith('/api/requests/') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Отправить заявку' }).click();
    const r = await response;
    expect(r.status()).toBe(201);
    const data = await r.json();
    await expect(page.getByText(`Заявка №${data.id} создана`)).toBeVisible();
  }
);
test(
  '06 — полный CRUD администратора через API',
  async ({ page }) => {
    await login(page);
    await expect(page.locator('.admin-row').first()).toBeVisible();
    const name = 'E2E услуга ' + Date.now();
    await page.getByRole('button', { name: '+ Добавить услугу' }).click();
    await page.getByLabel('Название', { exact: true }).fill(name);
    await page.getByLabel('Описание').fill('Проверка CRUD');
    await page.getByLabel('Цена, ₽').fill('1234');
    await page.getByLabel('Продолжительность, мин').fill('30');
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.getByText('Услуга создана.')).toBeVisible();
    const row = page.locator('.admin-row').filter({ hasText: name });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Изменить' }).click();
    await page.getByLabel('Цена, ₽').fill('555');
    await page.getByLabel('Категория', { exact: true }).selectOption({ index: 2 });
    await page.getByLabel('Услуга доступна').uncheck();
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.getByText('Изменения сохранены.')).toBeVisible();
    await expect(row).toContainText('555');
    await expect(row).toContainText('Недоступна');
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.setViewportSize({ width: 1280, height: 900 });
    await screenshot(page, '05-admin-1280');
    page.once('dialog', d => d.dismiss());
    await row.getByRole('button', { name: 'Удалить' }).click();
    await expect(row).toBeVisible();
    page.once('dialog', d => d.accept());
    await row.getByRole('button', { name: 'Удалить' }).click();
    await expect(page.getByText('Услуга удалена.')).toBeVisible();
    await expect(row).toHaveCount(0);
  }
);
test(
  '07 — 403 без прав и отказ входа',
  async ({ page, request }) => {
    const r = await request.post('/api/services/', { data: { name: 'Forbidden' } });
    expect([401, 403]).toContain(r.status());
    await page.goto('/manage');
    await page.getByLabel('Логин').fill('invalid-test-user');
    await page.getByLabel('Пароль').fill('wrong-password');
    await page.getByRole('button', { name: 'Войти' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: '+ Добавить услугу' })).toHaveCount(0);
  }
);
test(
  '08 — 500, повтор загрузки, пустая выдача',
  async ({ page }) => {
    await page.route(
      '**/api/services/?*',
      route => route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{"detail":"test error"}'
      })
    );
    await page.goto('/');
    await expect(page.getByRole('alert')).toContainText('Ошибка сервера');
    await page.unroute('**/api/services/?*');
    await page.getByRole('button', { name: 'Повторить загрузку' }).click();
    await expect(page.locator('.service-card').first()).toBeVisible();
    await page.getByLabel('Поиск', { exact: true }).fill('несуществующая-услуга-xyz');
    await expect(page.getByText('Ничего не найдено')).toBeVisible();
  }
);
