import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    return NextResponse.json({
      count: seasons.length,
      seasons,
    });
  } catch (error) {
    console.error("Failed to load public seasons", error);

    return NextResponse.json(
      { error: "Failed to load public seasons" },
      { status: 500 }
    );
  }
}