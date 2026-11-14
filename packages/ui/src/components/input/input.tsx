import { forwardRef, useId } from "react";
import type { InputProps } from "./input.types";
import styles from "./input.module.css";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      size = "medium",
      helperText,
      errorMessage,
      fullWidth = true,
      id,
      type = "text",
      className,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const messageId = `${inputId}-message`;

    const hasError = errorMessage != null;
    const message = hasError ? errorMessage : helperText;
    const hasMessage = message != null;

    const describedBy = [
      ariaDescribedBy,
      hasMessage ? messageId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    const inputClassNames = [
      styles.input,
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
          htmlFor={inputId}
          className={styles.label}
        >
          {label}
        </label>

        <input
          ref={ref}
          id={inputId}
          type={type}
          className={inputClassNames}
          aria-describedby={describedBy}
          aria-invalid={hasError || ariaInvalid}
          {...props}
        />

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

Input.displayName = "Input";
