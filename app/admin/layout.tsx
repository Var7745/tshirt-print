import React from 'react';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export const metadata = {
  title: 'JK Empress Admin Portal — Enterprise T-Shirt Operations',
  description: 'Enterprise Bulk T-Shirt Order, Production, Design and Customer Management for JK Empress.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
