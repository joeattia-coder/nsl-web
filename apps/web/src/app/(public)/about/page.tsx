import styles from "./AboutPage.module.css";

export default function AboutPage() {
  return (
    <main className={styles.aboutPage}>
      <section className={styles.aboutSection}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>About NSL</p>
          <h1 className={styles.title}>The National Snooker League</h1>
          <p className={styles.subtitle}>
            Building a stronger home for league play and regular competitive snooker events across North America.
          </p>
        </header>

        <div className={styles.statementCard}>
          <p className={styles.statement}>
            Launched in 2026, The National Snooker League (NSL) is premier snooker brand in North America for snooker league play and regular competitive events.
          </p>
        </div>
      </section>
    </main>
  );
}