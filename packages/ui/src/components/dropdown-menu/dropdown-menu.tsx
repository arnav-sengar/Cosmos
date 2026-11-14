"use client";

import {
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";

import { OverlayPortalContext } from "../../internal/overlay-portal-context";
import { DropdownMenuContext } from "./dropdown-menu.context";
import type { DropdownMenuProps } from "./dropdown-menu.types";

export function DropdownMenu({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  placement = "bottom-end",
  children,
}: DropdownMenuProps) {
  const portalRoot = useContext(OverlayPortalContext);

  const [uncontrolledOpen, setUncontrolledOpen] =
    useState(defaultOpen);

  const [activeIndex, setActiveIndex] =
    useState<number | null>(null);

  const [initialFocus, setInitialFocus] =
    useState<"first" | "last" | null>(null);

  const isControlled = controlledOpen !== undefined;

  const open = isControlled
    ? controlledOpen
    : uncontrolledOpen;
  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }

      if (!nextOpen) {
        setActiveIndex(null);
        setInitialFocus(null);
      }

      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  const {
    refs: {
      setReference,
      setFloating,
    },
    floatingStyles,
    context: floatingContext,
  } = useFloating<HTMLElement>({
    open,
    onOpenChange: setOpen,
    placement,
    strategy: portalRoot ? "fixed" : "absolute",
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const contextValue = useMemo(
    () => ({
      open,
      setOpen,
      activeIndex,
      setActiveIndex,
      initialFocus,
      setInitialFocus,
      floatingContext,
      setReference,
      setFloating,
      floatingStyles,
    }),
    [
      open,
      setOpen,
      activeIndex,
      initialFocus,
      floatingContext,
      setReference,
      setFloating,
      floatingStyles,
    ]
  );

  return (
    <DropdownMenuContext.Provider value={contextValue}>
      {children}
    </DropdownMenuContext.Provider>
  );
}
