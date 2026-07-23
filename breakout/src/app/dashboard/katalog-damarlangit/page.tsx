import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CatalogDamarlangitClient } from "./CatalogDamarlangitClient";

export default async function KatalogDamarlangitPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return <CatalogDamarlangitClient />;
}
