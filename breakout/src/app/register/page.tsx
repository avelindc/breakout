import { isMaintenanceActive } from "@/lib/maintenance";
import { RegisterClient } from "./RegisterClient";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const active = await isMaintenanceActive();
  if (active) {
    redirect("/maintenance");
  }

  return <RegisterClient />;
}
