import React, { useState, useRef } from 'react';
import { api, describe, fieldErrors } from '../api/client.js';
import { useResource } from '../hooks/useResource.js';
import { PageTitle, Field, Resource, ErrorState, Empty, Pagination, Status, money } from '../components/ui.jsx';

const blank = {
  name: '',
  category: '',
  description: '',
  price: '',
  duration_minutes: '',
  is_available: true
};

export default function Admin() {
  const [auth, setAuth] = useState(null);
  const [login, setLogin] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);

  async function signIn(e) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await api.verifyAdmin(login);
      setAuth({ ...login });
      setLogin({ username: '', password: '' });
    } catch (e) {
      setError(describe(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <main>
      <PageTitle
        kicker="АДМИНИСТРИРОВАНИЕ / 03"
        title="Управление каталогом"
        description="Добавляйте услуги и обновляйте цены, категории и доступность."
      >
        {auth && <button className="secondary" onClick={() => setAuth(null)}>Выйти</button>}
      </PageTitle>
      {auth
        ? <Manager auth={auth} />
        : (
          <form className="panel login" onSubmit={signIn}>
            <h2>Вход администратора</h2>
            <p className="hint">
              Используйте логин и пароль Django superuser. Данные хранятся только в памяти текущей страницы.
            </p>
            {['username', 'password'].map(k => (
              <Field
                key={k}
                name={k}
                label={k === 'username' ? 'Логин' : 'Пароль'}
              >
                <input
                  value={login[k]}
                  onChange={e => setLogin(v => ({ ...v, [k]: e.target.value }))}
                  type={k === 'password' ? 'password' : 'text'}
                  autoComplete={k === 'password' ? 'current-password' : 'username'}
                  required
                  disabled={busy}
                />
              </Field>
            ))}
            {error && <div className="notice error" role="alert">{error}</div>}
            <button
              className="primary"
              disabled={busy}
              type="submit"
            >
              {busy ? 'Проверяем…' : 'Войти'}
            </button>
          </form>
        )}
    </main>
  );
}

function Manager({ auth }) {
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const cats = useResource(api.categories, []);
  const list = useResource(
    signal => api.services({ page, page_size: 5 }, signal, auth),
    [page, version, auth]
  );

  function open(s) {
    setEditing(s?.id ?? null);
    setForm(s
      ? {
        name: s.name,
        category: String(s.category),
        description: s.description,
        price: s.price,
        duration_minutes: String(s.duration_minutes),
        is_available: s.is_available
      }
      : { ...blank, category: String(cats.data?.[0]?.id || '') });
    setFields({});
    setError('');
    setSuccess('');
  }

  function close() {
    setForm(null);
    setFields({});
    setError('');
  }

  function change(k) {
    return e => {
      const val = k === 'is_available' ? e.target.checked : e.target.value;
      setForm(f => ({ ...f, [k]: val }));
      setFields(f => ({ ...f, [k]: undefined }));
    };
  }

  async function save(e) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setSuccess('');
    setFields({});
    try {
      const body = {
        ...form,
        category: form.category ? Number(form.category) : null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null
      };
      if (editing === null) {
        await api.create(body, auth);
        setSuccess('Услуга создана.');
        setPage(Math.max(1, Math.ceil(((list.data?.count || 0) + 1) / 5)));
      } else {
        await api.update(editing, body, auth);
        setSuccess('Изменения сохранены.');
      }
      setVersion(v => v + 1);
      setForm(null);
    } catch (e) {
      setError(describe(e));
      setFields(fieldErrors(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function remove(s) {
    if (lock.current || !window.confirm(`Удалить услугу «${s.name}»?`)) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await api.remove(s.id, auth);
      setSuccess('Услуга удалена.');
      if (form && editing === s.id) close();
      if (list.data?.results.length === 1 && page > 1) setPage(p => p - 1);
      setVersion(v => v + 1);
    } catch (e) {
      setError(describe(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const control = (k, label, props) => (
    <Field
      key={k}
      name={k}
      label={label}
      error={fields[k]}
    >
      <input
        {...props}
        value={form[k]}
        onChange={change(k)}
        disabled={busy}
        aria-invalid={!!fields[k]}
        aria-describedby={k + '-error'}
      />
    </Field>
  );
  return (
    <div>
      <div className="toolbar">
        <span className="status yes">{`Администратор: ${auth.username}`}</span>
        <button
          className="primary"
          disabled={busy || !cats.data}
          onClick={() => open()}
        >
          + Добавить услугу
        </button>
      </div>
      {success && <div className="notice success-notice" role="status">{success}</div>}
      {error && (
        <div className="notice error" role="alert">
          {error}
          {fields.non_field_errors && <p>{String(fields.non_field_errors)}</p>}
        </div>
      )}
      {cats.error && <ErrorState error={cats.error} retry={cats.retry} />}
      {form && (
        <form
          className="panel form-panel admin-form"
          onSubmit={save}
          noValidate
        >
          <h2>{editing === null ? 'Новая услуга' : `Редактирование #${editing}`}</h2>
          {control('name', 'Название', { maxLength: 200 })}
          <Field
            name="category"
            label="Категория"
            error={fields.category}
          >
            <select
              value={form.category}
              onChange={change('category')}
              disabled={busy}
            >
              <option value="">Выберите категорию</option>
              {(cats.data || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field
            name="description"
            label="Описание"
            error={fields.description}
          >
            <textarea
              value={form.description}
              onChange={change('description')}
              rows={3}
              disabled={busy}
            />
          </Field>
          <div className="split">
            {control('price', 'Цена, ₽', { type: 'number', step: '0.01', min: 0 })}
            {control(
              'duration_minutes',
              'Продолжительность, мин',
              { type: 'number', min: 1, step: 1 }
            )}
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={form.is_available}
              onChange={change('is_available')}
              disabled={busy}
            />
            Услуга доступна
          </label>
          {fields.is_available && <p className="field-error">{String(fields.is_available)}</p>}
          <div className="actions">
            <button
              className="primary"
              type="submit"
              disabled={busy}
            >
              {busy ? 'Сохраняем…' : 'Сохранить'}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={close}
              disabled={busy}
            >
              Отмена
            </button>
          </div>
        </form>
      )}
      <Resource resource={list}>
        {data => (
          <section className="panel table-panel">
            <div className="results-header">
              <h2>Услуги</h2>
              <span>{`Всего: ${data.count}`}</span>
            </div>
            {data.results.length
              ? (
                <div className="admin-rows">
                  {data.results.map(s => (
                    <article className="admin-row" key={s.id}>
                      <div className="admin-name">
                        <small>{`#${s.id} · ${s.category_name}`}</small>
                        <strong>{s.name}</strong>
                      </div>
                      <div>
                        <strong>{money(s.price)}</strong>
                        <small>{`${s.duration_minutes} мин`}</small>
                      </div>
                      <Status available={s.is_available} />
                      <div className="actions">
                        <button
                          className="secondary"
                          disabled={busy || !cats.data}
                          onClick={() => open(s)}
                        >
                          Изменить
                        </button>
                        <button
                          className="danger"
                          disabled={busy}
                          onClick={() => remove(s)}
                        >
                          Удалить
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )
              : <Empty text="Услуг пока нет" detail="Добавьте первую услугу." />}
            {data.count > 0 && (
              <Pagination
                data={data}
                page={page}
                onChange={setPage}
              />
            )}
          </section>
        )}
      </Resource>
    </div>
  );
}
