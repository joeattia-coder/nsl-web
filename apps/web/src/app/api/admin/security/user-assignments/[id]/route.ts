import { NextResponse } from "next/server";
import { hasAdminPermission, resolveCurrentAdminUser } from "@/lib/admin-auth";
import { GLOBAL_ADMIN_ROLE_KEY, getVisibleUsersWhere } from "@/lib/admin-user-access";
import { prisma } from "@/lib/prisma";

function canManageAssignments(currentUser: NonNullable<Awaited<ReturnType<typeof resolveCurrentAdminUser>>>) {
  return (
    hasAdminPermission(currentUser, "users.edit") &&
    hasAdminPermission(currentUser, "roles.manage")
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

    if (!canManageAssignments(currentUser)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await context.params;
    const assignment = await prisma.userRoleAssignment.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        scopeType: true,
        scopeId: true,
        role: {
          select: {
            roleKey: true,
          },
        },
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    const visibleUser = await prisma.user.findFirst({
      where: {
        id: assignment.userId,
        ...getVisibleUsersWhere(currentUser),
      },
      select: { id: true },
    });

    if (!visibleUser) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    const isGlobalAdminAssignment =
      assignment.role.roleKey === GLOBAL_ADMIN_ROLE_KEY &&
      assignment.scopeType === "GLOBAL" &&
      assignment.scopeId === "";

    if (isGlobalAdminAssignment && !currentUser.isGlobalAdmin) {
      return NextResponse.json(
        { error: "Only global administrators can remove global administrator grants." },
        { status: 403 }
      );
    }

    if (isGlobalAdminAssignment && assignment.userId === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot remove your own direct global administrator assignment." },
        { status: 400 }
      );
    }

    await prisma.userRoleAssignment.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/security/user-assignments/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete assignment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}