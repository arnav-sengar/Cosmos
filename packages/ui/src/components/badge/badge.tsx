import type { BadgeProps } from "./badge.types";
import styles from "./badge.module.css";

export function Badge({
  variant = "neutral",
  size = "medium",
  appearance = "soft",
  className,
  children,
  ...props
}: BadgeProps) {
  const classNames = [
    styles.badge,
    styles[variant],
    styles[size],
    styles[appearance],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classNames}
      {...props}
    >
      {children}
    </span>
  );
}
