export type AdminFlashMessage = {
  title: string;
  message: string;
};

const ADMIN_FLASH_PREFIX = "admin-flash:";

export function setAdminFlashMessage(
  key: string,
  message: AdminFlashMessage
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      `${ADMIN_FLASH_PREFIX}${key}`,
      JSON.stringify(message)
    );
  } catch {}
}

export function consumeAdminFlashMessage(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const storageKey = `${ADMIN_FLASH_PREFIX}${key}`;

  try {
    const raw = window.sessionStorage.getItem(storageKey);

    if (!raw) {
      return null;
    }

    window.sessionStorage.removeItem(storageKey);

    const parsed = JSON.parse(raw) as Partial<AdminFlashMessage> | null;

    if (!parsed || typeof parsed.title !== "string" || typeof parsed.message !== "string") {
      return null;
    }

    return {
      title: parsed.title,
      message: parsed.message,
    } satisfies AdminFlashMessage;
  } catch {
    return null;
  }
}