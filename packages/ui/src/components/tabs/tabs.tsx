"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import type { TabsProps } from "./tabs.types";
import { TabsContext } from "./tabs.context";
import styles from "./tabs.module.css";

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      orientation = "horizontal",
      activationMode = "automatic",
      children,
      className,
      ...props
    },
    forwardedRef
  ) => {
    const generatedId = useId();
    const rootRef = useRef<HTMLDivElement>(null);

    const [internalValue, setInternalValue] = useState(defaultValue);
    const [firstTabValue, setFirstTabValue] = useState<string | undefined>(
      undefined
    );

    const isControlled = value !== undefined;
    const selectedValue = isControlled ? value : internalValue;

    const handleRootRef = useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node;

        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef]
    );

    const handleValueChange = useCallback(
      (nextValue: string) => {
        if (nextValue === selectedValue) return;

        if (!isControlled) {
          setInternalValue(nextValue);
        }

        onValueChange?.(nextValue);
      },
      [isControlled, onValueChange, selectedValue]
    );

    useEffect(() => {
      const root = rootRef.current;

      if (!root) return;

      const tabs = Array.from(
        root.querySelectorAll<HTMLButtonElement>(
          '[role="tab"][data-value]'
        )
      ).filter(
        (tab) => tab.closest("[data-tabs-root]") === root
      );

      const enabledTabs = tabs.filter(
        (tab) =>
          !tab.disabled &&
          tab.getAttribute("aria-disabled") !== "true"
      );

      const nextFirstTabValue =
        enabledTabs[0]?.getAttribute("data-value") ?? undefined;

      setFirstTabValue((current) =>
        current === nextFirstTabValue
          ? current
          : nextFirstTabValue
      );

      if (!isControlled) {
        const selectedTabIsEnabled = enabledTabs.some(
          (tab) =>
            tab.getAttribute("data-value") === selectedValue
        );

        if (!selectedTabIsEnabled) {
          setInternalValue(nextFirstTabValue);
        }
      }
    });

    const contextValue = useMemo(
      () => ({
        value: selectedValue,
        firstTabValue,
        onValueChange: handleValueChange,
        orientation,
        activationMode,
        baseId: generatedId,
      }),
      [
        selectedValue,
        firstTabValue,
        handleValueChange,
        orientation,
        activationMode,
        generatedId,
      ]
    );

    const classNames = [styles.root, className]
      .filter(Boolean)
      .join(" ");

    return (
      <TabsContext.Provider value={contextValue}>
        <div
          {...props}
          ref={handleRootRef}
          data-tabs-root=""
          data-orientation={orientation}
          className={classNames}
        >
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = "Tabs";
