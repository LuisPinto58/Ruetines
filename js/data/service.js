// Toda a comunicação com o servidor mock centralizada aqui.
// Os controllers nunca constroem pedidos fetch nem acedem diretamente aos headers ou ao token.

const API = 'http://localhost:3000';

const authHeaders = () => ({
  'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

const jsonHeaders = () => ({ 'Content-Type': 'application/json' });

// Autenticação

export const register = async (email, password) => {
  const res = await fetch(`${API}/register`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ email, password, role: 'user' }),
  });
  return { ok: res.status === 201 };
};

export const login = async (email, password) => {
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return { ok: false };
  const data = await res.json();
  console.log(data);
  return { ok: true, token: data.accessToken, user: data.user };
};