import { useState, useEffect } from 'react';

const KEY = 'service-catalog-favorites';

export function useFavorites() {
  const [ids, set] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(v) ? v.filter(Number.isInteger) : [];
    } catch {
      return [];
    }
  });
  useEffect(
    () => {
      try {
        localStorage.setItem(KEY, JSON.stringify(ids));
      } catch { }
    },
    [ids]
  );
  return {
    ids,
    toggle: id => set(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  };
}
