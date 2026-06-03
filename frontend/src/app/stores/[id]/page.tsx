import StorePageClient from "./StorePageClient";

export default async function StorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StorePageClient storeId={Number(id)} />;
}
