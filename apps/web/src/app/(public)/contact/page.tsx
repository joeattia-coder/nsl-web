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
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Contact NSL</p>
            <h1 className={styles.title}>Get in touch with the league team</h1>
            <p className={styles.subtitle}>
              Send a message directly to the National Snooker League for league questions, event inquiries, support requests, and general communication with the team.
            </p>
          </div>
        </header>

        <section className={styles.contactLayout}>
          <div className={styles.formShell}>
            <div className={styles.formIntro}>
              <p className={styles.sectionLabel}>Contact Form</p>
              <h2 className={styles.formTitle}>Send a message with the details that matter.</h2>
              <p className={styles.formCopy}>
                Use the form below for general league questions, event inquiries, and support requests. The clearer the details, the faster the response path.
              </p>
            </div>

            <ContactForm
              initialFirstName={firstName}
              initialLastName={lastName}
              initialEmail={email}
            />
          </div>

          <aside className={styles.contactAside}>
            <div className={styles.asideCard}>
              <p className={styles.asideLabel}>What To Include</p>
              <h2 className={styles.asideTitle}>Make your message easy to act on.</h2>
              <div className={styles.asideList}>
                <div className={styles.asideItem}>
                  <span>01</span>
                  <p>Name the event, competition, or account issue clearly.</p>
                </div>
                <div className={styles.asideItem}>
                  <span>02</span>
                  <p>Summarize the problem or request in the subject line first.</p>
                </div>
                <div className={styles.asideItem}>
                  <span>03</span>
                  <p>Add the context the team needs so they can respond without guessing.</p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}