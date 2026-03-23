import { NextResponse } from "next/server";
import { hasAdminPermission, resolveCurrentAdminUser } from "@/lib/admin-auth";
import { getVisibleUsersWhere } from "@/lib/admin-user-access";
import { prisma } from "@/lib/prisma";

function canManageOverrides(currentUser: NonNullable<Awaited<ReturnType<typeof resolveCurrentAdminUser>>>) {
  return (
    hasAdminPermission(currentUser, "users.edit") &&
    hasAdminPermission(currentUser, "permissions.manage")
  );
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

    if (!canManageOverrides(currentUser)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await context.params;
    const override = await prisma.userPermissionOverride.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!override) {
      return NextResponse.json({ error: "Override not found." }, { status: 404 });
    }

    const visibleUser = await prisma.user.findFirst({
      where: {
        id: override.userId,
        ...getVisibleUsersWhere(currentUser),
      },
      select: { id: true },
    });

    if (!visibleUser) {
      return NextResponse.json({ error: "Override not found." }, { status: 404 });
    }

    await prisma.userPermissionOverride.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/security/overrides/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete override",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}