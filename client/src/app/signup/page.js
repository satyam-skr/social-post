'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { loginUser, signupUser } from '@/redux/slices/authSlice';
import styles from '../auth.module.css';
import { loginUrlWithRedirect } from '@/utils/authRedirect';
import { useAuthRedirect } from '@/utils/useAuthRedirect';

function SignupForm() {
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated } = useAppSelector(state => state.auth);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { redirectTarget } = useAuthRedirect(isAuthenticated);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarData, setAvatarData] = useState('');
  const [avatarName, setAvatarName] = useState('');
  const [done, setDone] = useState(false);

  const handleAvatar = (file) => {
    if (!file) {
      setAvatarData('');
      setAvatarName('');
      return;
    }
    setAvatarName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarData(reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const signupResult = await dispatch(
      signupUser({ firstName, lastName, username, email, password, avatar: avatarData })
    );
    if (signupResult.error) {
      setDone(false);
      return;
    }

    // Backend signup does not create an authenticated session; login immediately.
    const loginResult = await dispatch(loginUser({ username, email, password }));
    setDone(!loginResult.error);
    if (!loginResult.error) {
      router.replace(redirectTarget || '/');
    }
  };

  const redirect = useMemo(() => searchParams?.get('redirect') || '/', [searchParams]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Signup</h1>
        <p className={styles.subtitle}>Join the colorful feed.</p>
        <form onSubmit={onSubmit} className={styles.form}>
          <input
            className={styles.input}
            placeholder="First Name *"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            className={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <input
            className={styles.input}
            placeholder="Username *"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            className={styles.input}
            placeholder="Email *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          <input
            className={styles.fileInput}
            type="file"
            accept="image/*"
            onChange={(e) => handleAvatar(e.target.files?.[0])}
          />
          {avatarName && (
            <div className={styles.avatarPreview}>
              <span>Selected:</span>
              <span>{avatarName}</span>
            </div>
          )}
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Signing up...' : 'Signup'}
          </button>
        </form>
        {error && <p className={styles.error}>{error}</p>}
        {done && <p className={styles.success}>Signup successful. Logged in.</p>}
        <div className={styles.links}>
          <Link href="/">Back to feed</Link>
          <Link href={loginUrlWithRedirect(redirect)}>Go to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className={styles.page}><div className={styles.card}>Loading...</div></div>}>
      <SignupForm />
    </Suspense>
  );
}
