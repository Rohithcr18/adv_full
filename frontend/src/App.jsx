import { Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Students from './pages/Students';
import Contact from './pages/Contact';

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand__title">ADV Full-Stack</span>
          <span className="brand__meta">Student & Hospital Admin Console</span>
        </div>
        <nav className="nav-links">
          {[
            { label: 'Home', to: '/' },
            { label: 'Students', to: '/students' },
            { label: 'Contact', to: '/contact' },
          ].map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="page-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/students" element={<Students />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
