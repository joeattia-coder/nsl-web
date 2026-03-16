import { prisma } from "@/lib/prisma";
import { requireAnyAdminPermission } from "@/lib/admin-auth";
import SecurityMetricCards from "../SecurityMetricCards";
import {
  formatDate,
  formatDateTime,
  formatScope,
  formatUserDisplayName,
} from "../security-utils";

export const dynamic = "force-dynamic";

export default async function AdminSecurityAssignmentsPage() {
  await requireAnyAdminPermission(["users.view", "roles.view"]);

  const [assignments, overrides, assignmentCount, overrideCount] =
    await Promise.all([
      prisma.userRoleAssignment.findMany({
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          scopeType: true,
          scopeId: true,
          createdAt: true,
          expiresAt: true,
          role: {
            select: {
              roleName: true,
            },
          },
          user: {
            select: {
              username: true,
              email: true,
              player: {
                select: {
                  firstName: true,
                  middleInitial: true,
                  lastName: true,
                },
              },
            },
          },
          grantedByUser: {
            select: {
              username: true,
              email: true,
              player: {
                select: {
                  firstName: true,
                  middleInitial: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      prisma.userPermissionOverride.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 25,
        select: {
          id: true,
          effect: true,
          scopeType: true,
          scopeId: true,
          reason: true,
          expiresAt: true,
          permission: {
            select: {
              permissionKey: true,
            },
          },
          user: {
            select: {
              username: true,
              email: true,
              player: {
                select: {
                  firstName: true,
                  middleInitial: true,
                  lastName: true,
                },
              },
            },
          },
          grantedByUser: {
            select: {
              username: true,
              email: true,
              player: {
                select: {
                  firstName: true,
                  middleInitial: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      prisma.userRoleAssignment.count(),
      prisma.userPermissionOverride.count(),
    ]);

  return (
    <div className="admin-security-stack">
      <SecurityMetricCards
        metrics={[
          {
            label: "Role Assignments",
            value: assignmentCount,
            hint: "Scoped grants currently active in the access model.",
          },
          {
            label: "Overrides",
            value: overrideCount,
            hint: "Allow and deny exceptions attached directly to users.",
          },
          {
            label: "Global Grants",
            value: assignments.filter((assignment) => assignment.scopeType === "GLOBAL").length,
            hint: "Assignments that apply platform-wide.",
          },
          {
            label: "Expiring Grants",
            value: assignments.filter((assignment) => assignment.expiresAt).length,
            hint: "Assignments with a bounded lifetime already configured.",
          },
        ]}
      />

      <section className="admin-security-panel admin-table-card">
        <div className="admin-security-panel-header">
          <div>
            <p className="admin-security-kicker">Assignments</p>
            <h2>Role Assignments</h2>
            <p>
              Review who has access, at what scope, when it was granted, and
              whether the grant expires.
            </p>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Scope</th>
                <th>Granted By</th>
                <th>Created</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-security-empty-cell">
                    No role assignments found.
                  </td>
                </tr>
              ) : (
                assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>{formatUserDisplayName(assignment.user)}</td>
                    <td>{assignment.role.roleName}</td>
                    <td>{formatScope(assignment.scopeType, assignment.scopeId)}</td>
                    <td>
                      {assignment.grantedByUser
                        ? formatUserDisplayName(assignment.grantedByUser)
                        : "System"}
                    </td>
                    <td>{formatDateTime(assignment.createdAt)}</td>
                    <td>{formatDate(assignment.expiresAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-security-panel admin-table-card">
        <div className="admin-security-panel-header">
          <div>
            <p className="admin-security-kicker">Overrides</p>
            <h2>User Permission Overrides</h2>
            <p>
              Exceptions are intentionally visible here so they remain rare,
              explicit, and auditable.
            </p>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Permission</th>
                <th>Effect</th>
                <th>Scope</th>
                <th>Granted By</th>
                <th>Reason</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {overrides.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-security-empty-cell">
                    No user overrides found.
                  </td>
                </tr>
              ) : (
                overrides.map((override) => (
                  <tr key={override.id}>
                    <td>{formatUserDisplayName(override.user)}</td>
                    <td>{override.permission.permissionKey}</td>
                    <td>
                      <span
                        className={`admin-security-badge ${
                          override.effect === "ALLOW"
                            ? "admin-security-badge-positive"
                            : "admin-security-badge-warning"
                        }`}
                      >
                        {override.effect}
                      </span>
                    </td>
                    <td>{formatScope(override.scopeType, override.scopeId)}</td>
                    <td>
                      {override.grantedByUser
                        ? formatUserDisplayName(override.grantedByUser)
                        : "System"}
                    </td>
                    <td>{override.reason ?? "-"}</td>
                    <td>{formatDate(override.expiresAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}