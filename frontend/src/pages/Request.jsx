import React, { useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api, fieldErrors, describe } from '../api/client.js';
import { useResource } from '../hooks/useResource.js';
import { PageTitle, Field, Resource, money } from '../components/ui.jsx';

export default function Request() {
  const [query] = useSearchParams();
  const [form, setForm] = useState({
    service: query.get('service') || '',
    client_name: '',
    phone: '',
    desired_at: ''
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(null);
  const lock = useRef(false);
  const services = useResource(api.available, []);
  const change = k => e => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(old => ({ ...old, [k]: undefined }));
    setMessage('');
  };

  async function submit(e) {
    e.preventDefault();
    if (lock.current) return;
    setErrors({});
    setMessage('');
    const local = {};
    if (!form.service) local.service = 'Выберите услугу.';
    if (!form.client_name.trim()) local.client_name = 'Укажите имя.';
    if (!form.phone.trim()) local.phone = 'Укажите телефон.';
    const date = new Date(form.desired_at);
    if (!form.desired_at || Number.isNaN(date.getTime())) local.desired_at = 'Укажите дату и время.';
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      const data = await api.apply({
        ...form,
        service: Number(form.service),
        client_name: form.client_name.trim(),
        phone: form.phone.trim(),
        desired_at: date.toISOString()
      });
      setSuccess(data);
    } catch (e) {
      setErrors(fieldErrors(e));
      setMessage(describe(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const field = (k, label, props) => (
    <Field
      name={k}
      label={label}
      error={errors[k]}
    >
      <input
        {...props}
        value={form[k]}
        onChange={change(k)}
        disabled={busy}
        aria-invalid={!!errors[k]}
        aria-describedby={k + '-error'}
      />
    </Field>
  );
  return (
    <main>
      <PageTitle
        kicker="ЗАПИСЬ / 02"
        title="Оставить заявку"
        description="Заполните контактные данные и выберите удобное время."
      />
      {success
        ? (
          <section className="panel success" role="status">
            <div className="success-icon">✓</div>
            <h2>{`Заявка №${success.id} создана`}</h2>
            <p>Заявка принята. Ожидайте подтверждения.</p>
            <Link to="/" className="primary">Вернуться в каталог</Link>
            <button
              className="secondary"
              onClick={() => {
                setSuccess(null);
                setForm({ service: '', client_name: '', phone: '', desired_at: '' });
              }}
            >
              Новая заявка
            </button>
          </section>
        )
        : (
          <Resource resource={services}>
            {list => (
              <div className="detail-layout">
                <form
                  className="panel form-panel"
                  onSubmit={submit}
                  noValidate
                >
                  <h2>Данные заявки</h2>
                  <Field
                    label="Услуга"
                    name="service"
                    error={errors.service}
                  >
                    <select
                      value={form.service}
                      onChange={change('service')}
                      disabled={busy}
                      aria-invalid={!!errors.service}
                      aria-describedby="service-error"
                    >
                      <option value="">Выберите услугу</option>
                      {(!list.some(s => String(s.id) === form.service) && form.service
                        ? [<option key="unavailable" value={form.service}>Услуга недоступна</option>]
                        : [])}
                      {list.map(s => <option key={s.id} value={s.id}>{`${s.name} — ${money(s.price)}`}</option>)}
                    </select>
                  </Field>
                  {field(
                    'desired_at',
                    'Желаемая дата и время',
                    { type: 'datetime-local', required: true }
                  )}
                  {field(
                    'client_name',
                    'Ваше имя',
                    {
                      placeholder: 'Иван Иванов',
                      maxLength: 150,
                      autoComplete: 'name',
                      required: true
                    }
                  )}
                  {field(
                    'phone',
                    'Телефон',
                    {
                      type: 'tel',
                      placeholder: '+7 900 000-00-00',
                      maxLength: 20,
                      autoComplete: 'tel',
                      required: true
                    }
                  )}
                  {message && (
                    <div className="notice error" role="alert">
                      {message}
                      {errors.non_field_errors && <p>{String(errors.non_field_errors)}</p>}
                    </div>
                  )}
                  <button
                    className="primary"
                    type="submit"
                    disabled={busy || !list.length}
                  >
                    {busy ? 'Отправляем…' : 'Отправить заявку'}
                  </button>
                </form>
                <aside className="panel booking">
                  <p className="eyebrow">КАК ЭТО РАБОТАЕТ</p>
                  <h2>Три простых шага</h2>
                  <ol className="steps">
                    <li>Выберите услугу и удобное время.</li>
                    <li>Оставьте имя и телефон.</li>
                    <li>Получите номер заявки.</li>
                  </ol>
                  <p className="hint">Контактные данные отправляются только в API и не сохраняются в браузере.</p>
                </aside>
              </div>
            )}
          </Resource>
        )}
    </main>
  );
}
