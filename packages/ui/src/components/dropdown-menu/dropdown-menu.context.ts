"use client";

import { createContext } from "react";
import type {
  CSSProperties,
  Dispatch,
  RefCallback,
  SetStateAction,
} from "react";
import type { FloatingContext } from "@floating-ui/react";

export type DropdownMenuInitialFocus = "first" | "last" | null;

export interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  activeIndex: number | null;
  setActiveIndex: Dispatch<SetStateAction<number | null>>;
  initialFocus: DropdownMenuInitialFocus;
  setInitialFocus: Dispatch<SetStateAction<DropdownMenuInitialFocus>>;
  floatingContext: FloatingContext<HTMLElement>;
  setReference: RefCallback<HTMLElement>;
  setFloating: RefCallback<HTMLElement>;
  floatingStyles: CSSProperties;
}

export const DropdownMenuContext =
  createContext<DropdownMenuContextValue | null>(null);
