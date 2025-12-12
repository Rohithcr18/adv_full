import { useState } from 'react';
import { api } from '../api';

function Login() {
  const [email, setEmail] = useState('admin@hospital.com');
  const [password, setPassword] = useState('123456');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      setToken(res.data.token);
      setMessage('Login successful');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Login</h1>
      {message && <p>{message}</p>}
      <form onSubmit={handleLogin}>
        <div>
          <label>Email:&nbsp;</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label>Password:&nbsp;</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Login</button>
      </form>
      {token && (
        <p>JWt Token Generated.</p>
      )}
    </div>
  );
}

export default Login
