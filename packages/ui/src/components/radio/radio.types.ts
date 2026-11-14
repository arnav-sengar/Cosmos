import type {
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

export type RadioSize =
  | "small"
  | "medium"
  | "large";

export type RadioOrientation =
  | "vertical"
  | "horizontal";

export interface RadioGroupProps
  extends Omit<
    ComponentPropsWithoutRef<"fieldset">,
    "children"
  > {
  label: ReactNode;
  name: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: RadioOrientation;
  size?: RadioSize;
  helperText?: ReactNode;
  errorMessage?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  children: ReactNode;
}

export interface RadioProps
  extends Omit<
    ComponentPropsWithoutRef<"input">,
    "type" | "size" | "value" | "name" | "checked" | "defaultChecked" | "onChange" | "required"
  > {
  value: string;
  label: ReactNode;
  size?: RadioSize;
}
