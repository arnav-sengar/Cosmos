import { forwardRef, useId } from "react";
import type { CheckboxProps } from "./checkbox.types";
import styles from "./checkbox.module.css";

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      size = "medium",
      helperText,
      errorMessage,
      id,
      className,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;
    const messageId = `${checkboxId}-message`;

    const hasError = errorMessage != null;
    const message = hasError ? errorMessage : helperText;
    const hasMessage = message != null;

    const describedBy = [
      ariaDescribedBy,
      hasMessage ? messageId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    const checkboxClassNames = [
      styles.checkbox,
      styles[size],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={styles.field} data-size={size}>
        <label className={styles.controlGroup}>
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={checkboxClassNames}
            aria-describedby={describedBy}
            aria-invalid={hasError || ariaInvalid}
            {...props}
          />

          <span className={styles.label}>
            {label}
          </span>
        </label>

        {hasMessage && (
          <div
            id={messageId}
            className={
              hasError
                ? styles.errorMessage
                : styles.helperText
            }
            role={hasError ? "alert" : undefined}
          >
            {message}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
