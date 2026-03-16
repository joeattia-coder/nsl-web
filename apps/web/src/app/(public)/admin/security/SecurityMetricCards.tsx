import {
  FiCheckCircle,
  FiKey,
  FiLayers,
  FiLock,
  FiShield,
  FiSliders,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";

type Metric = {
  label: string;
  value: string | number;
  hint: string;
};

type SecurityMetricCardsProps = {
  metrics: Metric[];
};

function getMetricVisual(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("user")) {
    return {
      icon: FiUsers,
      accentClassName: "admin-security-metric-card-users",
    };
  }

  if (normalized.includes("role")) {
    return {
      icon: FiShield,
      accentClassName: "admin-security-metric-card-roles",
    };
  }

  if (normalized.includes("permission") || normalized.includes("override")) {
    return {
      icon: FiKey,
      accentClassName: "admin-security-metric-card-permissions",
    };
  }

  if (normalized.includes("assignment") || normalized.includes("grant")) {
    return {
      icon: FiSliders,
      accentClassName: "admin-security-metric-card-assignments",
    };
  }

  if (normalized.includes("link")) {
    return {
      icon: FiLayers,
      accentClassName: "admin-security-metric-card-links",
    };
  }

  if (normalized.includes("system") || normalized.includes("global")) {
    return {
      icon: FiLock,
      accentClassName: "admin-security-metric-card-system",
    };
  }

  if (normalized.includes("active") || normalized.includes("enabled") || normalized.includes("verified")) {
    return {
      icon: FiUserCheck,
      accentClassName: "admin-security-metric-card-active",
    };
  }

  return {
    icon: FiCheckCircle,
    accentClassName: "admin-security-metric-card-default",
  };
}

export default function SecurityMetricCards({
  metrics,
}: SecurityMetricCardsProps) {
  return (
    <div className="admin-security-summary-grid">
      {metrics.map((metric) => {
        const { icon: Icon, accentClassName } = getMetricVisual(metric.label);

        return (
          <section
            key={metric.label}
            className={`admin-security-metric-card ${accentClassName}`}
          >
            <div className="admin-security-metric-header">
              <p className="admin-security-metric-label">{metric.label}</p>
              <span className="admin-security-metric-icon" aria-hidden="true">
                <Icon />
              </span>
            </div>
            <p className="admin-security-metric-value">{metric.value}</p>
            <p className="admin-security-metric-hint">{metric.hint}</p>
          </section>
        );
      })}
    </div>
  );
}