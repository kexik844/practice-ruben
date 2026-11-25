export const baseURL = (import.meta.env?.VITE_API_BASE_URL || '/api/').replace(/\/?$/, '/');

export class ApiError extends Error {
  constructor(status, data) {
    super(errorMessage(status));
    this.status = status;
    this.data = data;
  }
}

export function errorMessage(status) {
  return ({
    400: 'Проверьте введённые данные.',
    401: 'Неверные данные для входа.',
    403: 'Доступ запрещён. Проверьте права администратора.',
    404: 'Запрошенный объект или страница не найдены.',
    409: 'Объект связан с другими записями и не может быть удалён.'
  })[status] || (status >= 500 ? 'Ошибка сервера. Повторите попытку позже.' : 'Не удалось связаться с сервером. Проверьте подключение.');
}

export function fieldErrors(error) {
  return error?.status === 400 && error.data && typeof error.data === 'object' ? error.data : {};
}

export function describe(error) {
  const data = error?.data;
  return error?.message + (data?.detail && error.status < 500 ? ' ' + data.detail : '');
}

export async function request(path, { method = 'GET', params = {}, body, auth, signal } = {}) {
  const url = new URL(baseURL + path.replace(/^\//, ''), window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) headers.Authorization = 'Basic ' + btoa(String.fromCharCode(...new TextEncoder().encode(auth.username + ':' + auth.password)));
  let response;
  try {
    response = await fetch(
      url,
      {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
        credentials: 'omit'
      }
    );
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ApiError(0, null);
  }
  let data = null;
  if (response.status !== 204 && response.headers.get('content-type')?.includes('json')) {
    try {
      data = await response.json();
    } catch { }
  }
  if (!response.ok) throw new ApiError(response.status, data);
  if (response.status !== 204 && data === null) throw new ApiError(502, null);
  return data;
}

export async function allPages(path, options = {}) {
  let page = 1, all = [], data;
  do {
    data = await request(path, {
      ...options,
      params: { ...options.params, page, page_size: 10 }
    });
    all.push(...data.results);
    page++;
  } while (data.next);
  return all;
}

export const api = {
  categories: (signal) => allPages('categories/', { signal }),
  services: (params, signal, auth) => request('services/', { params, signal, auth }),
  service: (id, signal) => request(`services/${encodeURIComponent(id)}/`, { signal }),
  available: (signal) => allPages('services/', { signal, params: { is_available: true } }),
  apply: (body) => request('requests/', { method: 'POST', body }),
  verifyAdmin: (auth) => request('requests/', { auth, params: { page_size: 5 } }),
  create: (body, auth) => request('services/', { method: 'POST', body, auth }),
  update: (id, body, auth) => request(`services/${id}/`, { method: 'PATCH', body, auth }),
  remove: (id, auth) => request(`services/${id}/`, { method: 'DELETE', auth })
};
