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
import type { DropdownMenuLinkItemProps } from "./dropdown-menu.types";
import styles from "./dropdown-menu.module.css";

export function DropdownMenuLinkItem({
  children,
  href,
  onClick,
  onFocus,
  onSelect,
  closeOnSelect = true,
  disabled = false,
  textValue,
  target,
  className,
  ...props
}: DropdownMenuLinkItemProps) {
  const menu = useContext(DropdownMenuContext);

  if (!menu) {
    throw new Error(
      "DropdownMenuLinkItem must be used within DropdownMenu."
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
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }

      onClick?.(event);

      if (event.defaultPrevented) {
        return;
      }

      const isModifiedClick =
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey;

      const opensSeparateContext =
        target !== undefined && target !== "_self";

      if (isModifiedClick || opensSeparateContext) {
        return;
      }

      onSelect?.(event);

      if (!event.defaultPrevented && closeOnSelect) {
        setOpen(false);
      }
    },
    [
      disabled,
      onClick,
      target,
      onSelect,
      closeOnSelect,
      setOpen,
    ]
  );

  return (
    <a
      {...props}
      ref={ref}
      href={disabled ? undefined : href}
      target={target}
      role="menuitem"
      aria-disabled={disabled || undefined}
      tabIndex={
        !disabled && open && activeIndex === index ? 0 : -1
      }
      data-active={activeIndex === index ? "true" : undefined}
      className={[
        styles.item,
        styles.linkItem,
        className,
      ].filter(Boolean).join(" ")}
      onFocus={(event) => {
        onFocus?.(event);

        if (!disabled) {
          setActiveIndex(index);
        }
      }}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
