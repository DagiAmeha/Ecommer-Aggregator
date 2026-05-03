import { FormEvent, useState } from 'react';
import { login, logout, register } from '../services/auth.service';
import { useAuth } from '../hooks/useAuth';

export function AuthStatus() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  async function handleRegister(): Promise<void> {
    setError(null);

    try {
      await register(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Register failed');
    }
  }

  async function handleLogout(): Promise<void> {
    await logout();
  }

  if (loading) {
    return <p>Checking auth state...</p>;
  }

  if (user) {
    return (
      <div className="space-y-3 rounded-lg border border-slate-200 p-4">
        <p className="text-sm">Signed in as {user.email}</p>
        <button className="rounded bg-slate-900 px-4 py-2 text-white" onClick={handleLogout}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-3 rounded-lg border border-slate-200 p-4" onSubmit={handleLogin}>
      <h2 className="font-semibold">Firebase Authentication</h2>
      <input
        className="w-full rounded border border-slate-300 px-3 py-2"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <input
        className="w-full rounded border border-slate-300 px-3 py-2"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      <div className="flex gap-2">
        <button className="rounded bg-slate-900 px-4 py-2 text-white" type="submit">
          Login
        </button>
        <button className="rounded bg-slate-200 px-4 py-2" type="button" onClick={() => void handleRegister()}>
          Register
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
