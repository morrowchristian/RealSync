// src/pages/SignupPage.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { register } from '../api/auth';
import { extractErrorMessage } from '../utils/trial';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (!username.trim()) next.username = 'Username is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Password is required';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters';
    if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match';
    return next;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setServerError('');
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const data = await register({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      // Log the user in directly with the tokens from the register
      // response — same storage as LoginPage — so signup lands on the
      // dashboard without a second login step.
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      toast.success('Account created — welcome to RealSync');
      navigate('/');
    } catch (err) {
      const message = extractErrorMessage(err, 'Failed to create account');
      setServerError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (key: string) =>
    errors[key] ? (
      <p className="text-sm text-red-600">{errors[key]}</p>
    ) : null;

  return (
    <div className="max-w-md mx-auto mt-20 space-y-4">
      <h1 className="text-2xl font-bold">Sign Up</h1>
      <p className="text-sm text-gray-600">
        Create your RealSync account — your 5-day free trial starts right away.
      </p>
      <form onSubmit={handleSignup} noValidate className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Username"
            aria-label="Username"
            className="w-full p-2 border rounded"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          {fieldError('username')}
        </div>
        <div>
          <input
            type="email"
            placeholder="Email"
            aria-label="Email"
            className="w-full p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {fieldError('email')}
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            aria-label="Password"
            className="w-full p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {fieldError('password')}
        </div>
        <div>
          <input
            type="password"
            placeholder="Confirm password"
            aria-label="Confirm password"
            className="w-full p-2 border rounded"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {fieldError('confirmPassword')}
        </div>
        {serverError && (
          <p role="alert" className="text-sm text-red-600">
            {serverError}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className={`w-full p-2 text-white rounded ${
            submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600'
          }`}
        >
          {submitting ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
      <p className="text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-500 underline">
          Log in
        </Link>
      </p>
      <p className="text-sm text-gray-600">
        Just looking around?{' '}
        <Link to="/demo" className="text-blue-500 underline">
          View a read-only demo
        </Link>
      </p>
    </div>
  );
}
