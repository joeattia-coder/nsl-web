import { prisma } from "@/lib/prisma";
import { resolveCurrentUser } from "@/lib/admin-auth";
import ContactForm from "./ContactForm";
import styles from "./ContactPage.module.css";

export const dynamic = "force-dynamic";

function splitDisplayName(displayName: string | null | undefined) {
  const normalized = String(displayName ?? "").trim();

  if (!normalized) {
    return { firstName: "", lastName: "" };
  }

  const parts = normalized.split(/\s+/);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export default async function ContactPage() {
  const currentUser = await resolveCurrentUser();

  let firstName = "";
  let lastName = "";
  let email = currentUser?.email ?? "";

  if (currentUser?.linkedPlayerId) {
    const player = await prisma.player.findUnique({
      where: { id: currentUser.linkedPlayerId },
      select: {
        firstName: true,
        lastName: true,
        emailAddress: true,
      },
    });

    firstName = player?.firstName ?? "";
    lastName = player?.lastName ?? "";
    email = currentUser?.email ?? player?.emailAddress ?? "";
  } else {
    const derived = splitDisplayName(currentUser?.displayName);
    firstName = derived.firstName;
    lastName = derived.lastName;
  }

  return (
    <main className={styles.contactPage}>
      <section className={styles.contactSection}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Contact NSL</p>
          <h1 className={styles.title}>Get in touch with the league team</h1>
          <p className={styles.subtitle}>
            Send a message directly to the National Snooker League and we will forward it to
            {" "}
            <strong>
              <a href="mailto:info@nsl-tv.com">info@nsl-tv.com</a>
            </strong>
            .
          </p>
        </header>

        <div className={styles.formShell}>
          <div className={styles.formIntro}>
            <h2 className={styles.formTitle}>Contact form</h2>
            <p className={styles.formCopy}>
              Use the form below for general league questions, event inquiries, and support requests.
            </p>
          </div>

          <ContactForm
            initialFirstName={firstName}
            initialLastName={lastName}
            initialEmail={email}
          />
        </div>
      </section>
    </main>
  );
}