import { forwardRef, useId } from "react";
import type { SwitchProps } from "./switch.types";
import styles from "./switch.module.css";

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
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
    const switchId = id ?? generatedId;
    const messageId = `${switchId}-message`;

    const hasError = errorMessage != null;
    const message = hasError ? errorMessage : helperText;
    const hasMessage = message != null;

    const describedBy = [
      ariaDescribedBy,
      hasMessage ? messageId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    const switchClassNames = [
      styles.switch,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={styles.field} data-size={size}>
        <label
          htmlFor={switchId}
          className={styles.controlGroup}
        >
          <input
            {...props}
            ref={ref}
            id={switchId}
            type="checkbox"
            role="switch"
            className={switchClassNames}
            aria-describedby={describedBy}
            aria-invalid={hasError ? true : ariaInvalid}
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

Switch.displayName = "Switch";
