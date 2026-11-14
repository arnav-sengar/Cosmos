import type {
  ComponentPropsWithoutRef,
  CSSProperties,
} from "react";

export type SkeletonVariant =
  | "text"
  | "circular"
  | "rectangular";

export interface SkeletonProps
  extends Omit<
    ComponentPropsWithoutRef<"div">,
    "children" | "role"
  > {
  variant?: SkeletonVariant;
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
}
