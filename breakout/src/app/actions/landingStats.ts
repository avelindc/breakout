"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getLandingStats() {
  try {
    const [artistCount, releaseCount, streamCount] = await Promise.all([
      prisma.artist.count(),
      prisma.release.count({ where: { status: "RELEASED" } }),
      prisma.streaming.aggregate({ _sum: { playCount: true } }),
    ]);

    return {
      artistCount: artistCount || 0,
      releaseCount: releaseCount || 0,
      streamCount: streamCount._sum.playCount || 0,
    };
  } catch (error) {
    console.error("Failed to fetch landing stats:", error);
    return {
      artistCount: 0,
      releaseCount: 0,
      streamCount: 0,
    };
  }
}
