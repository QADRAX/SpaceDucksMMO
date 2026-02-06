import { redirect } from 'next/navigation';

export default async function MaterialDetailPage({
  params,
}: {
  params: { materialId: string };
}) {
  redirect(`/admin/resources/${params.materialId}`);
}
