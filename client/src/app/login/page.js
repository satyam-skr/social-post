'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { loginUser } from '@/redux/slices/authSlice';
import styles from '../auth.module.css';
import { signupUrlWithRedirect } from '@/utils/authRedirect';
import { useAuthRedirect } from '@/utils/useAuthRedirect';

function LoginPageContent() {
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated } = useAppSelector(state => state.auth);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { redirectTarget } = useAuthRedirect(isAuthenticated);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    const action = await dispatch(loginUser({ username: identifier, email: identifier, password }));
    if (!action.error) {
      router.replace(redirectTarget || '/');
    }
  };

  const redirect = searchParams?.get('redirect') || '/';

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Login</h1>
        <p className={styles.subtitle}>Use your username or email with password.</p>
        <form onSubmit={onSubmit} className={styles.form}>
          <input
            className={styles.input}
            placeholder="Username or Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <input
            className={styles.input}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {error && <p className={styles.error}>{error}</p>}
        {isAuthenticated && <p className={styles.success}>Logged in successfully.</p>}
        <div className={styles.links}>
          <Link href="/">Back to feed</Link>
          <Link href={signupUrlWithRedirect(redirect)}>Go to Signup</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className={styles.page}><div className={styles.card}><p className={styles.subtitle}>Loading login...</p></div></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
