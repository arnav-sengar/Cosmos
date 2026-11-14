import type {
  ComponentPropsWithoutRef,
} from "react";

export type DropdownMenuPlacement =
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

export interface DropdownMenuProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: DropdownMenuPlacement;
  children: React.ReactNode;
}

export interface DropdownMenuTriggerProps {
  children: React.ReactElement;
}

type DropdownMenuAccessibleName =
  | {
      "aria-label": string;
      "aria-labelledby"?: never;
    }
  | {
      "aria-label"?: never;
      "aria-labelledby": string;
    };

export type DropdownMenuContentProps =
  Omit<
    ComponentPropsWithoutRef<"div">,
    "role" | "aria-label" | "aria-labelledby"
  > &
  DropdownMenuAccessibleName;

export interface DropdownMenuItemProps
  extends Omit<
    ComponentPropsWithoutRef<"button">,
    "type" | "onSelect"
  > {
  onSelect?: () => void;
  closeOnSelect?: boolean;
  destructive?: boolean;
  textValue?: string;
  children: React.ReactNode;
}

export interface DropdownMenuLinkItemProps
  extends Omit<
    ComponentPropsWithoutRef<"a">,
    "aria-disabled" | "onSelect"
  > {
  onSelect?: (
    event: React.MouseEvent<HTMLAnchorElement>
  ) => void;
  closeOnSelect?: boolean;
  disabled?: boolean;
  textValue?: string;
  children: React.ReactNode;
}

export type DropdownMenuSeparatorProps =
  Omit<ComponentPropsWithoutRef<"div">, "role" | "aria-orientation">;
