"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function uploadMusicAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { artist: true }
  });

  if (!user?.artist) {
    return { error: "Artist profile not found" };
  }

  try {
    const title = formData.get("title") as string;
    const genre = formData.get("genre") as string;
    const language = formData.get("language") as string;
    const primaryArtist = formData.get("primaryArtist") as string || user.artist.stageName;
    const featuredArtist = formData.get("featuredArtist") as string;
    const composer = formData.get("composer") as string;
    const producer = formData.get("producer") as string;
    const lyrics = formData.get("lyrics") as string;
    const isrc = formData.get("isrc") as string;
    const upc = formData.get("upc") as string;
    const releaseDateStr = formData.get("releaseDate") as string;
    const releaseDate = new Date(releaseDateStr);
    
    const coverFile = formData.get("coverArtwork") as File;
    const audioFile = formData.get("audioFile") as File;

    if (!title || !genre || !language || !releaseDateStr || !coverFile || !audioFile) {
      return { error: "Missing required fields" };
    }

    let coverArtworkUrl = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop";
    let audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

    if (supabase) {
      // Upload Cover
      const coverExt = coverFile.name.split('.').pop();
      const coverPath = `covers/${user.artist.id}-${Date.now()}.${coverExt}`;
      const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
      
      const { error: coverError } = await supabase.storage
        .from('releases')
        .upload(coverPath, coverBuffer, {
          contentType: coverFile.type,
          upsert: false
        });
        
      if (coverError) {
        console.error("Cover upload error:", coverError);
        return { error: `Gagal mengupload cover ke Supabase: ${coverError.message}. Pastikan nama bucket 'releases' benar.` };
      }
      
      coverArtworkUrl = `${supabaseUrl}/storage/v1/object/public/releases/${coverPath}`;

      // Upload Audio
      const audioExt = audioFile.name.split('.').pop();
      const audioPath = `audio/${user.artist.id}-${Date.now()}.${audioExt}`;
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      
      const { error: audioError } = await supabase.storage
        .from('releases')
        .upload(audioPath, audioBuffer, {
          contentType: audioFile.type,
          upsert: false
        });
        
      if (audioError) {
        console.error("Audio upload error:", audioError);
        return { error: `Gagal mengupload lagu ke Supabase: ${audioError.message}` };
      }
      
      audioUrl = `${supabaseUrl}/storage/v1/object/public/releases/${audioPath}`;
    }

    // Create Release & Track in DB
    const release = await prisma.release.create({
      data: {
        artistId: user.artist.id,
        title,
        type: "SINGLE",
        genre,
        language,
        primaryArtist,
        featuredArtist,
        releaseDate,
        coverArtworkUrl,
        status: "PENDING",
        tracks: {
          create: {
            title,
            audioUrl,
            composer,
            producer,
            lyrics,
            isrc,
            upc
          }
        }
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/releases");
    revalidatePath("/admin/releases");

    return { success: true, releaseId: release.id };
  } catch (error: any) {
    console.error("Upload error:", error);
    return { error: error.message || "Failed to upload release" };
  }
}
