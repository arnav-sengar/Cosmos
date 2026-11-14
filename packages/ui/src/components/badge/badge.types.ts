import type {
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

export type BadgeVariant =
  | "neutral"
  | "success"
  | "warning"
  | "error"
  | "information";

export type BadgeSize =
  | "small"
  | "medium";

export type BadgeAppearance =
  | "soft"
  | "solid"
  | "outline";

export interface BadgeProps
  extends ComponentPropsWithoutRef<"span"> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  appearance?: BadgeAppearance;
  children: ReactNode;
}
