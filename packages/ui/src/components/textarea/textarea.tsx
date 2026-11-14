import { forwardRef, useId } from "react";
import type { TextareaProps } from "./textarea.types";
import styles from "./textarea.module.css";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      size = "medium",
      resize = "vertical",
      helperText,
      errorMessage,
      fullWidth = true,
      id,
      className,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const messageId = `${textareaId}-message`;

    const hasError = errorMessage != null;
    const message = hasError ? errorMessage : helperText;
    const hasMessage = message != null;

    const describedBy = [
      ariaDescribedBy,
      hasMessage ? messageId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    const textareaClassNames = [
      styles.textarea,
      styles[size],
      styles[resize],
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
          htmlFor={textareaId}
          className={styles.label}
        >
          {label}
        </label>

        <textarea
          ref={ref}
          id={textareaId}
          className={textareaClassNames}
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

Textarea.displayName = "Textarea";
