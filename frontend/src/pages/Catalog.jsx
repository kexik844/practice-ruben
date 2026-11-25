import React, { useState } from 'react';
import { api, fieldErrors } from '../api/client.js';
import { useResource, useDebounce } from '../hooks/useResource.js';
import { Filters, initialFilters } from '../components/Filters.jsx';
import { PageTitle, Resource, ServiceCard, Empty, Pagination, ErrorState, Loading } from '../components/ui.jsx';

export default function Catalog({ favorites }) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const search = useDebounce(filters.search, 400);
  const params = { ...filters, search, page, page_size: 5 };
  const cats = useResource(api.categories, []);
  const waiting = search !== filters.search;
  const list = useResource(signal => api.services(params, signal), [JSON.stringify(params)]);
  const change = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };
  return (
    <main>
      <PageTitle
        kicker="КАТАЛОГ / 01"
        title="Найдите нужную услугу"
        description="Выберите специалиста, сравните цены и оставьте заявку онлайн."
      />
      <div className="catalog-layout">
        <div>
          <Filters
            values={filters}
            onChange={change}
            categories={cats.data || []}
            onReset={() => {
              setFilters(initialFilters);
              setPage(1);
            }}
          />
          {cats.error && <ErrorState error={cats.error} retry={cats.retry} />}
        </div>
        <section aria-label="Результаты поиска">
          {waiting
            ? <Loading />
            : (
              <Resource resource={list}>
                {data => (
                  <>
                    <div className="results-header">
                      <h2>Все услуги</h2>
                      <span>{`Найдено: ${data.count}`}</span>
                    </div>
                    {data.results.length
                      ? (
                        <div className="cards">
                          {data.results.map(s => (
                            <ServiceCard
                              key={s.id}
                              service={s}
                              favorites={favorites}
                            />
                          ))}
                        </div>
                      )
                      : <Empty />}
                    {data.count > 0 && (
                      <Pagination
                        data={data}
                        page={page}
                        onChange={setPage}
                      />
                    )}
                  </>
                )}
              </Resource>
            )}
          {list.error?.status === 400 && (
            <div className="error-fields">
              {Object.entries(fieldErrors(list.error)).map(([k, v]) => (
                <p key={k}>
                  {`${({
                    min_price: 'Цена от',
                    max_price: 'Цена до',
                    category: 'Категория',
                    page: 'Страница'
                  })[k] || k}: ${v}`}
                </p>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
