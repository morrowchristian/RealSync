// src/pages/LoginPage.tsx
import { useState } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await api.post('token/', { email, password });
      localStorage.setItem('access', response.data.access);
      localStorage.setItem('refresh', response.data.refresh);
      toast.success('Login successful');
      navigate('/leads');
    } catch {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 space-y-4">
      <h1 className="text-2xl font-bold">Login</h1>
      <input
        type="email"
        placeholder="Email"
        className="w-full p-2 border rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full p-2 border rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={handleLogin}
        className="w-full p-2 bg-blue-600 text-white rounded"
      >
        Log In
      </button>
    </div>
  );
}
