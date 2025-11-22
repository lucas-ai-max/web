'use client';

import { useToastStore } from '@/lib/toast-store';
import { ToastContainer } from './ToastContainer';

export function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  return <ToastContainer toasts={toasts} onRemove={removeToast} />;
}

