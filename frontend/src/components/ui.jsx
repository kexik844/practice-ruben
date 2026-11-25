import React from 'react';
import { Link } from 'react-router-dom';
import { describe } from '../api/client.js';

export const money = value => new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 2
}).format(Number(value));

export function Loading() {
  return (
    <div className="state" role="status">
      <span className="spinner" />
      Загрузка данных…
    </div>
  );
}

export function Empty({ text = 'Ничего не найдено', detail = 'Попробуйте изменить параметры поиска.' }) {
  return (
    <div className="state">
      <strong>{text}</strong>
      <p>{detail}</p>
    </div>
  );
}

export function ErrorState({ error, retry }) {
  return (
    <div className="state error" role="alert">
      <strong>{describe(error)}</strong>
      {retry && <button onClick={retry} className="secondary">Повторить загрузку</button>}
    </div>
  );
}

export function Resource({ resource, children }) {
  if (resource.loading) return <Loading />;
  if (resource.error) return <ErrorState error={resource.error} retry={resource.retry} />;
  return children(resource.data);
}

export function Field({ label, name, error, children }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {React.cloneElement(
        children,
        {
          id: name,
          'aria-describedby': name + '-error',
          'aria-invalid': !!error
        }
      )}
      <span
        className="field-error"
        id={name + '-error'}
        role={error ? 'alert' : undefined}
      >
        {error ? (Array.isArray(error) ? error.join(' ') : String(error)) : null}
      </span>
    </div>
  );
}

export function Status({ available }) {
  return (
    <span className={'status ' + (available ? 'yes' : 'no')}>
      {available ? 'Доступна' : 'Недоступна'}
    </span>
  );
}

export function ServiceCard({ service: s, favorites }) {
  return (
    <article className="service-card">
      <div className="card-top">
        <span className="category">{s.category_name}</span>
        <button
          className="heart"
          type="button"
          aria-label={favorites.ids.includes(s.id) ? 'Убрать из избранного' : 'В избранное'}
          aria-pressed={favorites.ids.includes(s.id)}
          onClick={() => favorites.toggle(s.id)}
        >
          {favorites.ids.includes(s.id) ? '♥' : '♡'}
        </button>
      </div>
      <h2><Link to={`/services/${s.id}`}>{s.name}</Link></h2>
      <p className="description">{s.description}</p>
      <div className="meta">
        <Status available={s.is_available} />
        <span>{`${s.duration_minutes} мин`}</span>
      </div>
      <div className="card-bottom">
        <strong className="price">{money(s.price)}</strong>
        <Link className="secondary" to={`/services/${s.id}`}>Подробнее →</Link>
      </div>
    </article>
  );
}

export function Pagination({ data, page, onChange }) {
  return (
    <nav className="pagination" aria-label="Страницы">
      <button
        className="secondary"
        disabled={!data.previous}
        onClick={() => onChange(page - 1)}
      >
        ← Назад
      </button>
      <span>{`Страница ${page} из ${Math.max(1, Math.ceil(data.count / 5))}`}</span>
      <button
        className="secondary"
        disabled={!data.next}
        onClick={() => onChange(page + 1)}
      >
        Далее →
      </button>
    </nav>
  );
}

export function PageTitle({ kicker, title, description, children }) {
  return (
    <header className="page-title">
      <div>
        <p className="eyebrow">{kicker}</p>
        <h1>{title}</h1>
        <p className="sub">{description}</p>
      </div>
      {children}
    </header>
  );
}
