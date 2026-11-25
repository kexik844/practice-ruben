import React from 'react';
import { Field } from './ui.jsx';

export const initialFilters = {
  category: '',
  is_available: '',
  min_price: '',
  max_price: '',
  search: '',
  ordering: ''
};

export function Filters({ values, onChange, categories, onReset }) {
  const set = k => e => onChange(k, e.target.value);
  return (
    <aside className="filters panel">
      <div className="filter-heading">
        <h2>Фильтры</h2>
        <button className="text-button" onClick={onReset}>Сбросить</button>
      </div>
      <Field name="search" label="Поиск">
        <input
          value={values.search}
          onChange={set('search')}
          placeholder="Название или описание"
          type="search"
        />
      </Field>
      <Field name="category" label="Категория">
        <select value={values.category} onChange={set('category')}>
          <option value="">Все категории</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field name="is_available" label="Доступность">
        <select value={values.is_available} onChange={set('is_available')}>
          <option value="">Любая</option>
          <option value="true">Доступные</option>
          <option value="false">Недоступные</option>
        </select>
      </Field>
      <div className="split">
        <Field name="min_price" label="Цена от, ₽">
          <input
            type="number"
            min={0}
            value={values.min_price}
            onChange={set('min_price')}
            placeholder="0"
          />
        </Field>
        <Field name="max_price" label="Цена до, ₽">
          <input
            type="number"
            min={0}
            value={values.max_price}
            onChange={set('max_price')}
            placeholder="Любая"
          />
        </Field>
      </div>
      <Field name="ordering" label="Сортировка">
        <select value={values.ordering} onChange={set('ordering')}>
          <option value="">По умолчанию</option>
          <option value="price">Сначала дешевле</option>
          <option value="-price">Сначала дороже</option>
        </select>
      </Field>
      <p className="hint">Гостям доступны только опубликованные услуги.</p>
    </aside>
  );
}
