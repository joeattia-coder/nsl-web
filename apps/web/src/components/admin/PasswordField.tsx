"use client";

import { type ComponentProps, useId, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

type PasswordFieldProps = Omit<ComponentProps<"input">, "type">;

export default function PasswordField({
  className,
  id,
  ...props
}: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        {...props}
        id={inputId}
        type={isVisible ? "text" : "password"}
        className={className ? `${className} password-field-input` : "password-field-input"}
      />
      <button
        type="button"
        className="password-field-toggle"
        onClick={() => setIsVisible((current) => !current)}
        aria-controls={inputId}
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
      >
        {isVisible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
      </button>
    </div>
  );
}