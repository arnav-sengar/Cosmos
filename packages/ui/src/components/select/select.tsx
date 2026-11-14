import { forwardRef, useId } from "react";
import type { SelectProps } from "./select.types";
import styles from "./select.module.css";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      size = "medium",
      helperText,
      errorMessage,
      fullWidth = true,
      id,
      className,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const messageId = `${selectId}-message`;

    const hasError = errorMessage != null;
    const message = hasError ? errorMessage : helperText;
    const hasMessage = message != null;

    const describedBy = [
      ariaDescribedBy,
      hasMessage ? messageId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    const selectClassNames = [
      styles.select,
      styles[size],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const fieldClassNames = [
      styles.field,
      fullWidth && styles.fullWidth,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={fieldClassNames}>
        <label
          htmlFor={selectId}
          className={styles.label}
        >
          {label}
        </label>

        <div className={styles.control}>
          <select
            {...props}
            ref={ref}
            id={selectId}
            className={selectClassNames}
            aria-describedby={describedBy}
            aria-invalid={hasError ? true : ariaInvalid}
          >
            {children}
          </select>

          <span
            className={styles.indicator}
            aria-hidden="true"
          />
        </div>

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

Select.displayName = "Select";
