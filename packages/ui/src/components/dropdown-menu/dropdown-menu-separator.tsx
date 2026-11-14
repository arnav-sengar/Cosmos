import type { DropdownMenuSeparatorProps } from "./dropdown-menu.types";
import styles from "./dropdown-menu.module.css";

export function DropdownMenuSeparator({
  className,
  ...props
}: DropdownMenuSeparatorProps) {
  return (
    <div
      {...props}
      role="separator"
      aria-orientation="horizontal"
      className={[
        styles.separator,
        className,
      ].filter(Boolean).join(" ")}
    />
  );
}
