"use client";

import { forwardRef } from "react";

import type { TabsContentProps } from "./tabs.types";

import { useTabsContext } from "./tabs.context";

import styles from "./tabs.module.css";

function getPanelId(baseId: string, value: string) {
  return `${baseId}-panel-${encodeURIComponent(value)}`;
}

function getTabId(baseId: string, value: string) {
  return `${baseId}-tab-${encodeURIComponent(value)}`;
}

export const TabsContent = forwardRef<
  HTMLDivElement,
  TabsContentProps
>(
  (
    {
      value,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const { value: selectedValue, baseId } =
      useTabsContext();

    const isSelected = selectedValue === value;

    const classNames = [
      styles.content,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        {...props}
        ref={ref}
        id={getPanelId(baseId, value)}
        role="tabpanel"
        aria-labelledby={getTabId(baseId, value)}
        hidden={!isSelected}
        tabIndex={0}
        className={classNames}
      >
        {children}
      </div>
    );
  }
);

TabsContent.displayName = "TabsContent";
