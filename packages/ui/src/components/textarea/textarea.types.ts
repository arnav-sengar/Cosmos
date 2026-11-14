import type {
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

export type TextareaSize =
  | "small"
  | "medium"
  | "large";

export type TextareaResize =
  | "none"
  | "vertical"
  | "horizontal"
  | "both";

export interface TextareaProps
  extends ComponentPropsWithoutRef<"textarea"> {
  label: ReactNode;
  size?: TextareaSize;
  resize?: TextareaResize;
  helperText?: ReactNode;
  errorMessage?: ReactNode;
  fullWidth?: boolean;
}
