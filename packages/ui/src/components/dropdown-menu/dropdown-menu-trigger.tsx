"use client";

import {
  cloneElement,
  useCallback,
  useContext,
} from "react";
import type {
  HTMLProps,
  KeyboardEvent,
  ReactElement,
  Ref,
} from "react";

import {
  useClick,
  useInteractions,
} from "@floating-ui/react";

import { DropdownMenuContext } from "./dropdown-menu.context";
import type { DropdownMenuTriggerProps } from "./dropdown-menu.types";

function assignRef<T>(
  ref: Ref<T> | undefined,
  node: T | null
): void | (() => void) {
  if (typeof ref === "function") {
    return ref(node);
  }

  if (ref) {
    (ref as { current: T | null }).current = node;
  }
}

export function DropdownMenuTrigger({
  children,
}: DropdownMenuTriggerProps) {
  const menu = useContext(DropdownMenuContext);

  if (!menu) {
    throw new Error(
      "DropdownMenuTrigger must be used within DropdownMenu."
    );
  }

  const {
    open,
    setOpen,
    setInitialFocus,
    floatingContext,
    setReference,
  } = menu;

  const click = useClick(floatingContext);

  const { getReferenceProps } = useInteractions([
    click,
  ]);

  const childRef = (
    children.props as { ref?: Ref<HTMLElement> }
  ).ref;

  const mergedRef = useCallback(
    (node: HTMLElement | null) => {
      setReference(node);

      const cleanup = assignRef(childRef, node);

      if (node === null) {
        return;
      }

      return () => {
        if (typeof cleanup === "function") {
          cleanup();
        } else {
          assignRef(childRef, null);
        }

        setReference(null);
      };
    },
    [childRef, setReference]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.defaultPrevented || open) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setInitialFocus("first");
        setOpen(true);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setInitialFocus("last");
        setOpen(true);
      }
    },
    [open, setInitialFocus, setOpen]
  );

  const childProps = children.props as HTMLProps<HTMLElement>;

  const referenceProps = getReferenceProps({
    ...childProps,
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      childProps.onKeyDown?.(event);
      handleKeyDown(event);
    },
  });

  const trigger = cloneElement(
    children as ReactElement<Record<string, unknown>>,
    {
      ...referenceProps,

      ref: mergedRef,
      "aria-haspopup": "menu",
      "aria-expanded": open,
    }
  );

  return trigger;
}
