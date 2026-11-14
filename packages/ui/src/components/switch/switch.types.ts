import type {
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

export type SwitchSize =
  | "small"
  | "medium"
  | "large";

export interface SwitchProps
  extends Omit<
    ComponentPropsWithoutRef<"input">,
    "type" | "size"
  > {
  label: ReactNode;
  size?: SwitchSize;
  helperText?: ReactNode;
  errorMessage?: ReactNode;
}
