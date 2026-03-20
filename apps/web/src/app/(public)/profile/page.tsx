import { redirect } from "next/navigation";
import { resolveCurrentUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const currentUser = await resolveCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/profile");
  }

  if (!currentUser.linkedPlayerId) {
    return (
      <section className="admin-page login-page-shell">
        <div className="login-page-card">
          <div className="login-page-copy">
            <p className="login-page-kicker">Profile</p>
            <h1 className="login-page-title">No player profile linked</h1>
            <p className="login-page-subtitle">
              Your account is not linked to a player profile yet. Contact an administrator to complete account setup.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const player = await prisma.player.findUnique({
    where: {
      id: currentUser.linkedPlayerId,
    },
    select: {
      id: true,
      firstName: true,
      middleInitial: true,
      lastName: true,
      dateOfBirth: true,
      emailAddress: true,
      phoneNumber: true,
      photoUrl: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      stateProvince: true,
      country: true,
      postalCode: true,
      updatedAt: true,
    },
  });

  if (!player) {
    return (
      <section className="admin-page login-page-shell">
        <div className="login-page-card">
          <div className="login-page-copy">
            <p className="login-page-kicker">Profile</p>
            <h1 className="login-page-title">Profile unavailable</h1>
            <p className="login-page-subtitle">
              Your linked player profile could not be found. Contact an administrator.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page login-page-shell">
      <div className="login-page-card">
        <div className="login-page-copy">
          <p className="login-page-kicker">Profile</p>
          <h1 className="login-page-title">{player.firstName} {player.lastName}</h1>
          <p className="login-page-subtitle">
            Signed in as {currentUser.email ?? currentUser.username ?? "User"}.
          </p>
        </div>

        <ProfileForm
          initialData={{
            id: player.id,
            firstName: player.firstName,
            middleInitial: player.middleInitial,
            lastName: player.lastName,
            dateOfBirth: player.dateOfBirth
              ? player.dateOfBirth.toISOString().slice(0, 10)
              : null,
            emailAddress: player.emailAddress,
            phoneNumber: player.phoneNumber,
            photoUrl: player.photoUrl,
            addressLine1: player.addressLine1,
            addressLine2: player.addressLine2,
            city: player.city,
            stateProvince: player.stateProvince,
            country: player.country,
            postalCode: player.postalCode,
            updatedAt: player.updatedAt.toISOString(),
          }}
        />
      </div>
    </section>
  );
}