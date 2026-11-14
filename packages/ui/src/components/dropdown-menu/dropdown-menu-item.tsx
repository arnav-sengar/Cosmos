"use client";

import {
  useCallback,
  useContext,
} from "react";
import type {
  MouseEvent,
} from "react";

import {
  useListItem,
} from "@floating-ui/react";

import { DropdownMenuContext } from "./dropdown-menu.context";
import type { DropdownMenuItemProps } from "./dropdown-menu.types";
import styles from "./dropdown-menu.module.css";

export function DropdownMenuItem({
  children,
  onClick,
  onFocus,
  onSelect,
  closeOnSelect = true,
  destructive = false,
  disabled = false,
  textValue,
  className,
  ...props
}: DropdownMenuItemProps) {
  const menu = useContext(DropdownMenuContext);

  if (!menu) {
    throw new Error(
      "DropdownMenuItem must be used within DropdownMenu."
    );
  }

  const { open, setOpen, activeIndex, setActiveIndex } = menu;

  const label =
    textValue ??
    (typeof children === "string" || typeof children === "number"
      ? String(children)
      : null);

  const { ref, index } = useListItem({
    label,
  });

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);

      if (event.defaultPrevented || disabled) {
        return;
      }

      onSelect?.();

      if (closeOnSelect) {
        setOpen(false);
      }
    },
    [onClick, onSelect, disabled, closeOnSelect, setOpen]
  );

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      role="menuitem"
      disabled={disabled}
      tabIndex={open && activeIndex === index ? 0 : -1}
      data-active={activeIndex === index ? "true" : undefined}
      data-destructive={destructive ? "true" : undefined}
      className={[
        styles.item,
        className,
      ].filter(Boolean).join(" ")}
      onFocus={(event) => {
        onFocus?.(event);
        setActiveIndex(index);
      }}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
