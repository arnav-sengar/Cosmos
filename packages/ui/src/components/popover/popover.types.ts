import type {
  ReactElement,
  ReactNode,
} from "react";

export type PopoverPlacement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end";

export interface PopoverProps {
  content: ReactNode;
  children: ReactElement;

  label: string;

  placement?: PopoverPlacement;

  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  disabled?: boolean;

  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
}
