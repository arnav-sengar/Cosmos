import type {
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary";

export type ButtonSize =
  | "small"
  | "medium"
  | "large";

export interface ButtonProps
  extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
}
