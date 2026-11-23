// src/pages/LoginPage.tsx
import { useState } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { extractErrorMessage } from '../utils/trial';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await api.post('token/', { username, password });
      localStorage.setItem('access', response.data.access);
      localStorage.setItem('refresh', response.data.refresh);
      toast.success('Login successful');
      navigate('/leads');
    } catch (err) {
      // Surface the server's message (e.g. a trial-expired error)
      // instead of always blaming the credentials.
      toast.error(extractErrorMessage(err, 'Invalid credentials'));
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 space-y-4">
      <h1 className="text-2xl font-bold">Login</h1>
      <input
        type="text"
        placeholder="Username"
        className="w-full p-2 border rounded"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
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
      <p className="text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="text-blue-500 underline">
          Sign up
        </Link>
      </p>
      <p className="text-sm text-gray-600">
        <Link to="/demo" className="text-blue-500 underline">
          View a read-only demo
        </Link>
      </p>
    </div>
  );
}
