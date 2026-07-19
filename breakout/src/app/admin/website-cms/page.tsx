import { getLandingPageCMS } from "@/app/actions/cms";
import CMSClient from "./CMSClient";

export const dynamic = "force-dynamic";

export default async function WebsiteCMSPage() {
  const cmsData = await getLandingPageCMS();

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Website CMS</h1>
        <p className="text-gray-500 text-sm">Kelola seluruh konten Landing Page dari satu tempat.</p>
      </div>

      <CMSClient initialData={cmsData} />
    </div>
  );
}
