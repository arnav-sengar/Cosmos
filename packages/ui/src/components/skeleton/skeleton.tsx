import {
  forwardRef,
} from "react";

import type {
  SkeletonProps,
} from "./skeleton.types";

import styles from "./skeleton.module.css";

export const Skeleton = forwardRef<
  HTMLDivElement,
  SkeletonProps
>(
  (
    {
      variant = "text",
      width,
      height,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.root,
      styles[variant],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        {...props}
        ref={ref}
        aria-hidden="true"
        data-variant={variant}
        className={classNames}
        style={{
          ...style,
          width: width ?? style?.width,
          height: height ?? style?.height,
        }}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";
