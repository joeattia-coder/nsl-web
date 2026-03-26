"use client";

import type { CSSProperties, ComponentType } from "react";
import { useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import styles from "./ThemeToggle.module.css";

export type ThemeMode = "light" | "dark";

type ThemeToggleIconProps = {
  className?: string;
  "aria-hidden"?: boolean;
};

export type ThemeToggleProps = {
  value?: ThemeMode;
  defaultValue?: ThemeMode;
  onChange?: (theme: ThemeMode) => void;
  activePillColor?: string;
  className?: string;
  ariaLabel?: string;
  lightLabel?: string;
  darkLabel?: string;
  disabled?: boolean;
  lightIcon?: ComponentType<ThemeToggleIconProps>;
  darkIcon?: ComponentType<ThemeToggleIconProps>;
};

export default function ThemeToggle({
  value,
  defaultValue = "dark",
  onChange,
  activePillColor,
  className,
  ariaLabel = "Theme mode",
  lightLabel = "Light",
  darkLabel = "Dark",
  disabled = false,
  lightIcon: LightIcon = FiSun,
  darkIcon: DarkIcon = FiMoon,
}: ThemeToggleProps) {
  const [internalValue, setInternalValue] = useState<ThemeMode>(defaultValue);
  const selectedTheme = value ?? internalValue;
  const isControlled = value !== undefined;

  const handleSelect = (nextTheme: ThemeMode) => {
    if (disabled || nextTheme === selectedTheme) {
      return;
    }

    if (!isControlled) {
      setInternalValue(nextTheme);
    }

    onChange?.(nextTheme);
  };

  const rootClassName = [styles.root, className].filter(Boolean).join(" ");
  const rootStyle = activePillColor
    ? ({ "--theme-toggle-active-pill": activePillColor } as CSSProperties)
    : undefined;

  return (
    <div className={rootClassName} style={rootStyle}>
      <div className={styles.track} role="group" aria-label={ariaLabel} data-selected={selectedTheme}>
        <span className={styles.activePill} aria-hidden="true" />

        <button
          type="button"
          className={`${styles.option} ${selectedTheme === "light" ? styles.optionActive : ""}`.trim()}
          aria-pressed={selectedTheme === "light"}
          aria-label={lightLabel}
          disabled={disabled}
          onClick={() => handleSelect("light")}
        >
          <LightIcon className={styles.icon} aria-hidden="true" />
          <span className={styles.label}>{lightLabel}</span>
        </button>

        <button
          type="button"
          className={`${styles.option} ${selectedTheme === "dark" ? styles.optionActive : ""}`.trim()}
          aria-pressed={selectedTheme === "dark"}
          aria-label={darkLabel}
          disabled={disabled}
          onClick={() => handleSelect("dark")}
        >
          <DarkIcon className={styles.icon} aria-hidden="true" />
          <span className={styles.label}>{darkLabel}</span>
        </button>
      </div>
    </div>
  );
}