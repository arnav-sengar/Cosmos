import type {
  ComponentPropsWithoutRef,
} from "react";

export type SeparatorOrientation =
  | "horizontal"
  | "vertical";

export interface SeparatorProps
  extends Omit<
    ComponentPropsWithoutRef<"div">,
    "role"
  > {
  orientation?: SeparatorOrientation;
  decorative?: boolean;
}
