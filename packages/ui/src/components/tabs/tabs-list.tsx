"use client";

import {
  forwardRef,
  useCallback,
} from "react";

import type { KeyboardEvent } from "react";
import type { TabsListProps } from "./tabs.types";

import { useTabsContext } from "./tabs.context";

import styles from "./tabs.module.css";

export const TabsList = forwardRef<
  HTMLDivElement,
  TabsListProps
>(
  (
    {
      children,
      className,
      onKeyDown,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      dir,
      ...props
    },
    ref
  ) => {
    const { orientation } = useTabsContext();

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);

        if (event.defaultPrevented) {
          return;
        }

        const isHorizontal = orientation === "horizontal";
        const direction =
          dir ??
          event.currentTarget.closest("[dir]")?.getAttribute("dir") ??
          "ltr";

        const isRtl = direction === "rtl";

        const forwardKey = isHorizontal
          ? isRtl
            ? "ArrowLeft"
            : "ArrowRight"
          : "ArrowDown";

        const backwardKey = isHorizontal
          ? isRtl
            ? "ArrowRight"
            : "ArrowLeft"
          : "ArrowUp";

        const isForward = event.key === forwardKey;
        const isBackward = event.key === backwardKey;
        const isHome = event.key === "Home";
        const isEnd = event.key === "End";

        if (
          !isForward &&
          !isBackward &&
          !isHome &&
          !isEnd
        ) {
          return;
        }

        const tabs = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>(
            '[role="tab"]:not(:disabled)'
          )
        ).filter(
          (tab) => tab.getAttribute("aria-disabled") !== "true"
        );

        const target =
          event.target instanceof HTMLButtonElement
            ? event.target
            : null;

        if (!target || tabs.length === 0) {
          return;
        }

        const currentIndex = tabs.indexOf(target);

        if (currentIndex === -1) {
          return;
        }

        event.preventDefault();

        let nextIndex: number;

        if (isHome) {
          nextIndex = 0;
        } else if (isEnd) {
          nextIndex = tabs.length - 1;
        } else if (isForward) {
          nextIndex = (currentIndex + 1) % tabs.length;
        } else {
          nextIndex =
            (currentIndex - 1 + tabs.length) % tabs.length;
        }

        tabs[nextIndex]?.focus();
      },
      [orientation, onKeyDown, dir]
    );

    const classNames = [
      styles.list,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    if (!ariaLabel && !ariaLabelledBy) {
      throw new Error(
        "TabsList requires an aria-label or aria-labelledby."
      );
    }

    return (
      <div
        {...props}
        ref={ref}
        dir={dir}
        role="tablist"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-orientation={orientation}
        onKeyDown={handleKeyDown}
        className={classNames}
      >
        {children}
      </div>
    );
  }
);

TabsList.displayName = "TabsList";
