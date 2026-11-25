import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom';
import { useFavorites } from './hooks/useFavorites.js';
import { Empty } from './components/ui.jsx';
import Catalog from './pages/Catalog.jsx';
import Detail from './pages/Detail.jsx';
import Request from './pages/Request.jsx';
import Admin from './pages/Admin.jsx';
import Favorites from './pages/Favorites.jsx';
import './styles.css';

function App() {
  const favorites = useFavorites();
  return (
    <>
      <header className="site-header">
        <div className="nav-wrap">
          <Link to="/" className="brand">
            <span className="logo">С</span>
            <span>
              Сервис
              <small>каталог услуг</small>
            </span>
          </Link>
          <nav className="navigation" aria-label="Основная навигация">
            <NavLink to="/" end>Каталог</NavLink>
            <NavLink to="/request">Заявка</NavLink>
            <NavLink to="/favorites">{`Избранное (${favorites.ids.length})`}</NavLink>
            <NavLink to="/manage">Управление</NavLink>
          </nav>
        </div>
      </header>
      <div className="shell">
        <Routes>
          <Route path="/" element={<Catalog favorites={favorites} />} />
          <Route path="/services/:id" element={<Detail favorites={favorites} />} />
          <Route path="/request" element={<Request />} />
          <Route path="/manage" element={<Admin />} />
          <Route path="/favorites" element={<Favorites favorites={favorites} />} />
          <Route
            path="*"
            element={<Empty
              text="Страница не найдена"
              detail="Вернитесь в каталог через меню."
            />}
          />
        </Routes>
      </div>
      <footer className="footer">Сервис · Учебный проект УП.05 / React + Django REST API</footer>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
