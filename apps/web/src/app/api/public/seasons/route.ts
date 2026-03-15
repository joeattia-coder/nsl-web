import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicApiJson, publicApiOptions } from "@/lib/public-api-response";

export function OPTIONS() {
  return publicApiOptions();
}

export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      where: {
        tournaments: {
          some: {
            isPublished: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return publicApiJson({
      count: seasons.length,
      seasons,
    });
  } catch (error) {
    console.error("Failed to load public seasons", error);

    return publicApiJson(
      { error: "Failed to load public seasons" },
      { status: 500 }
    );
  }
}