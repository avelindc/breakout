import { auth } from "@/auth";
import { BrandSettingsForm } from "@/components/BrandSettingsForm";
import { MaintenanceSettingsForm } from "@/components/MaintenanceSettingsForm";
import { CatalogVisibilitySettings } from "@/components/CatalogVisibilitySettings";
import { TelegramSettingsForm } from "@/components/TelegramSettingsForm";
import { getMaintenanceData } from "@/lib/maintenance";
import { PrismaClient } from "@prisma/client";
import { getTelegramSettingsAction } from "@/app/actions/telegram";

const prisma = new PrismaClient();

export default async function AdminSettingsPage() {
  const session = await auth();

  const maintenanceData = await getMaintenanceData();
  const brandSetting = await prisma.settings.findUnique({
    where: { key: 'brand_logo' }
  });
  const brandLogo = brandSetting?.value || "/logo.png";

  const rphSetting = await prisma.settings.findUnique({ where: { key: 'enable_catalog_rph' } });
  const khanaSetting = await prisma.settings.findUnique({ where: { key: 'enable_catalog_khana' } });
  const haloSetting = await prisma.settings.findUnique({ where: { key: 'enable_catalog_halo' } });

  const initialRph = rphSetting?.value !== "false";
  const initialKhana = khanaSetting?.value !== "false";
  const initialHalo = haloSetting?.value !== "false";

  const telegramSettings = await getTelegramSettingsAction();
  const telegramData = telegramSettings.data || { enabled: false, botToken: "", chatId: "" };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Settings</h1>
        <p className="text-gray-500">Configure global platform rules and your admin profile.</p>
      </div>

      <CatalogVisibilitySettings initialRph={initialRph} initialKhana={initialKhana} initialHalo={initialHalo} />

      <MaintenanceSettingsForm initialData={maintenanceData as any} brandLogo={brandLogo} />

      <TelegramSettingsForm initialData={telegramData} />

      <BrandSettingsForm />

      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Settings</h2>
        
        <form className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input type="email" disabled defaultValue={session?.user?.email || ""} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Name</label>
              <input type="text" defaultValue={session?.user?.name || ""} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input type="password" placeholder="Leave blank to keep current password" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500" />
          </div>

          <button type="button" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
