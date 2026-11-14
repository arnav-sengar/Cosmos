import type {
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

export type SelectSize =
  | "small"
  | "medium"
  | "large";

export interface SelectProps
  extends Omit<
    ComponentPropsWithoutRef<"select">,
    "size"
  > {
  label: ReactNode;
  size?: SelectSize;
  helperText?: ReactNode;
  errorMessage?: ReactNode;
  fullWidth?: boolean;
}
