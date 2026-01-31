import { AdminLayout } from '@/components/organisms/AdminLayout';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
