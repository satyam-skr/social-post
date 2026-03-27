'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/redux/hooks';
import { fetchCurrentUser } from '@/redux/slices/authSlice';

export default function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const requestedRef = useRef(false);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return null;
}

