import { NextResponse } from "next/server";
import { hasAdminPermission, resolveCurrentAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { parseOptionalString, parseRequiredString } from "../_utils";

function canManagePermissions(currentUser: NonNullable<Awaited<ReturnType<typeof resolveCurrentAdminUser>>>) {
  return hasAdminPermission(currentUser, "permissions.manage");
}

export async function POST(request: Request) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!canManagePermissions(currentUser)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await request.json();
    const permissionKey = parseRequiredString(body.permissionKey, "Permission key").toLowerCase();
    const permissionName = parseRequiredString(body.permissionName, "Permission name");
    const category = parseRequiredString(body.category, "Category");
    const description = parseOptionalString(body.description);

    const existingPermission = await prisma.permission.findUnique({
      where: { permissionKey },
      select: { id: true },
    });

    if (existingPermission) {
      return NextResponse.json(
        { error: "A permission with that key already exists." },
        { status: 409 }
      );
    }

    const createdPermission = await prisma.permission.create({
      data: {
        permissionKey,
        permissionName,
        category,
        description,
      },
      select: {
        id: true,
        permissionKey: true,
      },
    });

    return NextResponse.json(createdPermission, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/security/permissions error:", error);

    return NextResponse.json(
      {
        error: "Failed to create permission",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}