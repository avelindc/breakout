import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { UploadForm } from "@/components/UploadForm";

const prisma = new PrismaClient();

export default async function UploadMusicPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { artists: true },
  });

  if (!user) {
    redirect("/login");
  }

  const artists = user.artists || [];

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Music</h1>
        <p className="text-gray-400">Release your new track to the world.</p>
      </div>

      <UploadForm artists={artists} userId={user.id} />
    </div>
  );
}
