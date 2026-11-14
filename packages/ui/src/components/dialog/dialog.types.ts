import type {
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

export type DialogSize =
  | "small"
  | "medium"
  | "large";

export interface DialogProps
  extends Omit<
    ComponentPropsWithoutRef<"dialog">,
    | "children"
    | "open"
    | "title"
    | "onCancel"
    | "onClose"
    | "onClick"
    | "aria-labelledby"
    | "aria-describedby"
  > {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: ReactNode;
  description?: ReactNode;

  size?: DialogSize;

  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  showCloseButton?: boolean;

  children: ReactNode;
}
