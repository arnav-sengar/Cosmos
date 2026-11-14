"use client";

import {
  forwardRef,
} from "react";

import type {
  SeparatorProps,
} from "./separator.types";

import styles from "./separator.module.css";

export const Separator = forwardRef<
  HTMLDivElement,
  SeparatorProps
>(
  (
    {
      orientation = "horizontal",
      decorative = false,
      className,
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.root,
      styles[orientation],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        {...props}
        ref={ref}
        role={decorative ? undefined : "separator"}
        aria-orientation={
          decorative ? undefined : orientation
        }
        aria-hidden={decorative || undefined}
        data-orientation={orientation}
        className={classNames}
      />
    );
  }
);

Separator.displayName = "Separator";
