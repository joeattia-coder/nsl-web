const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "-";
  }

  return dateFormatter.format(value);
}

export function formatDateTime(value: Date | null | undefined) {
  if (!value) {
    return "-";
  }

  return `${dateFormatter.format(value)} ${value.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export function formatScope(scopeType: string, scopeId: string) {
  if (scopeType === "GLOBAL") {
    return "Global";
  }

  if (!scopeId) {
    return scopeType;
  }

  return `${scopeType}: ${scopeId}`;
}

export function formatUserDisplayName(user: {
  username: string | null;
  email: string | null;
  player:
    | {
        firstName: string;
        middleInitial: string | null;
        lastName: string;
      }
    | null;
}) {
  if (user.player) {
    return [user.player.firstName, user.player.middleInitial, user.player.lastName]
      .filter(Boolean)
      .join(" ");
  }

  if (user.username) {
    return user.username;
  }

  if (user.email) {
    return user.email;
  }

  return "Unnamed user";
}

export function compactList(values: string[], emptyLabel = "-") {
  if (values.length === 0) {
    return emptyLabel;
  }

  return values.join(", ");
}