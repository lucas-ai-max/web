'use client';

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useToastStore } from '@/lib/toast-store';
import { ToastContainer } from '@/components/ui/ToastContainer';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {children}
      </main>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

