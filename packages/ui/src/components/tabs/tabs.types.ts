import type {
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

export type TabsOrientation =
  | "horizontal"
  | "vertical";

export type TabsActivationMode =
  | "automatic"
  | "manual";

export interface TabsProps
  extends Omit<
    ComponentPropsWithoutRef<"div">,
    "children"
  > {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: TabsOrientation;
  activationMode?: TabsActivationMode;
  children: ReactNode;
}

export interface TabsListProps
  extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
}

export interface TabsTriggerProps
  extends Omit<
    ComponentPropsWithoutRef<"button">,
    "type"
  > {
  value: string;
  children: ReactNode;
}

export interface TabsContentProps
  extends ComponentPropsWithoutRef<"div"> {
  value: string;
  children: ReactNode;
}
