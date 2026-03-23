import { NextResponse } from "next/server";
import { hasAdminPermission, resolveCurrentAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { parseOptionalString, parseRequiredString } from "../../_utils";

function canManagePermissions(currentUser: NonNullable<Awaited<ReturnType<typeof resolveCurrentAdminUser>>>) {
  return hasAdminPermission(currentUser, "permissions.manage");
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!canManagePermissions(currentUser)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await context.params;
    const existingPermission = await prisma.permission.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingPermission) {
      return NextResponse.json({ error: "Permission not found." }, { status: 404 });
    }

    const body = await request.json();
    const permissionKey = parseRequiredString(body.permissionKey, "Permission key").toLowerCase();
    const permissionName = parseRequiredString(body.permissionName, "Permission name");
    const category = parseRequiredString(body.category, "Category");
    const description = parseOptionalString(body.description);

    const conflictingPermission = await prisma.permission.findFirst({
      where: {
        id: { not: id },
        permissionKey,
      },
      select: { id: true },
    });

    if (conflictingPermission) {
      return NextResponse.json(
        { error: "A permission with that key already exists." },
        { status: 409 }
      );
    }

    const updatedPermission = await prisma.permission.update({
      where: { id },
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

    return NextResponse.json(updatedPermission);
  } catch (error) {
    console.error("PATCH /api/admin/security/permissions/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to update permission",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!canManagePermissions(currentUser)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await context.params;
    const existingPermission = await prisma.permission.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            rolePermissions: true,
            userPermissionOverrides: true,
          },
        },
      },
    });

    if (!existingPermission) {
      return NextResponse.json({ error: "Permission not found." }, { status: 404 });
    }

    if (
      existingPermission._count.rolePermissions > 0 ||
      existingPermission._count.userPermissionOverrides > 0
    ) {
      return NextResponse.json(
        { error: "Remove role links and overrides before deleting this permission." },
        { status: 400 }
      );
    }

    await prisma.permission.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/security/permissions/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete permission",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}