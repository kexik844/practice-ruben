import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useResource } from '../hooks/useResource.js';
import { Resource, Status, money } from '../components/ui.jsx';

export default function Detail({ favorites }) {
  const { id } = useParams();
  const resource = useResource(signal => api.service(id, signal), [id]);
  return (
    <main>
      <Link to="/" className="back">← К каталогу</Link>
      <Resource resource={resource}>
        {s => (
          <div className="detail-layout">
            <article className="panel detail">
              <p className="eyebrow">{s.category_name}</p>
              <h1>{s.name}</h1>
              <Status available={s.is_available} />
              <h2>Об услуге</h2>
              <p className="description full">{s.description}</p>
              <div className="detail-meta">
                <div>
                  <small>Продолжительность</small>
                  <strong>{`${s.duration_minutes} мин`}</strong>
                </div>
                <div>
                  <small>Номер услуги</small>
                  <strong>{`#${s.id}`}</strong>
                </div>
              </div>
            </article>
            <aside className="panel booking">
              <p className="eyebrow">СТОИМОСТЬ</p>
              <strong className="big-price">{money(s.price)}</strong>
              <p>Выберите удобные дату и время — мы свяжемся с вами.</p>
              {s.is_available
                ? <Link className="primary" to={`/request?service=${s.id}`}>Оставить заявку</Link>
                : <p>Запись недоступна</p>}
              <button className="secondary" onClick={() => favorites.toggle(s.id)}>
                {favorites.ids.includes(s.id) ? '♥ Убрать из избранного' : '♡ В избранное'}
              </button>
            </aside>
          </div>
        )}
      </Resource>
    </main>
  );
}
