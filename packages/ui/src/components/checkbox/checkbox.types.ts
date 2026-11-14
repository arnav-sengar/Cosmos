import type {
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

export type CheckboxSize =
  | "small"
  | "medium"
  | "large";

export interface CheckboxProps
  extends Omit<
    ComponentPropsWithoutRef<"input">,
    "type" | "size"
  > {
  label: ReactNode;
  size?: CheckboxSize;
  helperText?: ReactNode;
  errorMessage?: ReactNode;
}
