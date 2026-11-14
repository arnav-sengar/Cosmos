"use client";

import { forwardRef } from "react";

import type {
  FocusEvent,
  MouseEvent,
} from "react";

import type { TabsTriggerProps } from "./tabs.types";
import { useTabsContext } from "./tabs.context";
import styles from "./tabs.module.css";

function getTabId(baseId: string, value: string) {
  return `${baseId}-tab-${encodeURIComponent(value)}`;
}

export const TabsTrigger = forwardRef<
  HTMLButtonElement,
  TabsTriggerProps
>(
  (
    {
      value,
      children,
      className,
      disabled = false,
      "aria-disabled": ariaDisabled,
      onClick,
      onFocus,
      ...props
    },
    forwardedRef
  ) => {
    const {
      value: selectedValue,
      firstTabValue,
      onValueChange,
      activationMode,
      baseId,
    } = useTabsContext();

    const isDisabled =
      disabled ||
      ariaDisabled === true ||
      ariaDisabled === "true";

    const isSelected = selectedValue === value;

    const handleFocus = (
      event: FocusEvent<HTMLButtonElement>
    ) => {
      onFocus?.(event);

      if (
        !event.defaultPrevented &&
        activationMode === "automatic" &&
        !isDisabled
      ) {
        onValueChange(value);
      }
    };

    const handleClick = (
      event: MouseEvent<HTMLButtonElement>
    ) => {
      onClick?.(event);

      if (
        !event.defaultPrevented &&
        !isDisabled &&
        activationMode === "manual"
      ) {
        onValueChange(value);
      }
    };

    const classNames = [styles.trigger, className]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        {...props}
        ref={forwardedRef}
        type="button"
        role="tab"
        id={getTabId(baseId, value)}
        data-value={value}
        aria-selected={isSelected}
        aria-disabled={isDisabled || undefined}
        aria-controls={`${baseId}-panel-${encodeURIComponent(value)}`}
        tabIndex={
          !isDisabled &&
          (isSelected ||
            (selectedValue === undefined &&
              firstTabValue === value))
            ? 0
            : -1
        }
        disabled={isDisabled}
        onFocus={handleFocus}
        onClick={handleClick}
        className={classNames}
      >
        {children}
      </button>
    );
  }
);

TabsTrigger.displayName = "TabsTrigger";
