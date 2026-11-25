import React from 'react';
import { api } from '../api/client.js';
import { useResource } from '../hooks/useResource.js';
import { PageTitle, Resource, Empty, ServiceCard } from '../components/ui.jsx';

export default function Favorites({ favorites }) {
  const data = useResource(api.available, []);
  return (
    <main>
      <PageTitle
        kicker="ИЗБРАННОЕ / 04"
        title="Избранные услуги"
        description="Список сохранён только в этом браузере."
      />
      {favorites.ids.length
        ? (
          <Resource resource={data}>
            {list => {
              const selected = list.filter(s => favorites.ids.includes(s.id));
              return selected.length
                ? (
                  <div className="cards">
                    {selected.map(s => (
                      <ServiceCard
                        key={s.id}
                        service={s}
                        favorites={favorites}
                      />
                    ))}
                  </div>
                )
                : (
                  <Empty
                    text="Сохранённые услуги недоступны"
                    detail="Они могут быть удалены или скрыты администратором."
                  />
                );
            }}
          </Resource>
        )
        : (
          <Empty
            text="Пока ничего не сохранено"
            detail="Нажмите на сердечко в каталоге."
          />
        )}
    </main>
  );
}
