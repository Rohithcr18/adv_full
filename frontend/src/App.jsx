import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Students from './pages/Students';
import Contact from './pages/Contact';
import Login from './pages/Login';

function App() {
  return (
    <div>
      <nav style={{ padding: 10, borderBottom: '1px solid #ccc', marginBottom: 20 }}>
        <Link to="/" style={{ marginRight: 10 }}>Home</Link>
        <Link to="/students" style={{ marginRight: 10 }}>Students</Link>
        <Link to="/contact" style={{ marginRight: 10 }}>Contact</Link>
        <Link to="/login">Login</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/students" element={<Students />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;
