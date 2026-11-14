import type {
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

export type InputSize =
  | "small"
  | "medium"
  | "large";

export interface InputProps
  extends Omit<
    ComponentPropsWithoutRef<"input">,
    "size"
  > {
  label: ReactNode;
  size?: InputSize;
  helperText?: ReactNode;
  errorMessage?: ReactNode;
  fullWidth?: boolean;
}
