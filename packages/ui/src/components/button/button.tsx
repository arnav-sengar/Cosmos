import { forwardRef } from "react";
import type { ButtonProps } from "./button.types";
import styles from "./button.module.css";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "medium",
      loading = false,
      loadingLabel = "Loading...",
      disabled,
      type = "button",
      children,
      className,
      "aria-busy": ariaBusy,
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.button,
      styles[variant],
      styles[size],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type={type}
        className={classNames}
        disabled={disabled || loading}
        aria-busy={loading || ariaBusy}
        {...props}
      >
        {loading && (
          <span
            className={styles.spinner}
            aria-hidden="true"
          />
        )}

        <span aria-live="polite" aria-atomic="true">
          {loading ? loadingLabel : children}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";
