"use client";

import {
  forwardRef,
  useCallback,
  useId,
  useMemo,
  useState,
} from "react";

import type { AccordionProps } from "./accordion.types";
import { AccordionContext } from "./accordion.context";

import styles from "./accordion.module.css";

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  (props, forwardedRef) => {
    const generatedId = useId();

    const {
      children,
      className,
      disabled = false,
      type,
      value,
      defaultValue,
      onValueChange,
      collapsible,
      ...rootProps
    } = props;

    const isCollapsible =
      type === "single" ? collapsible ?? false : true;

    const isControlled = value !== undefined;

    const [internalValue, setInternalValue] = useState<string[]>(
      () => {
        if (type === "single") {
          return defaultValue ? [defaultValue] : [];
        }

        return defaultValue ?? [];
      }
    );

    const selectedValue: string[] = isControlled
      ? type === "single"
        ? value
          ? [value]
          : []
        : value
      : internalValue;

    const handleItemToggle = useCallback(
      (itemValue: string) => {
        if (disabled) return;

        const isOpen = selectedValue.includes(itemValue);
        let nextValue: string[];

        if (type === "single") {
          if (isOpen) {
            if (!isCollapsible) return;
            nextValue = [];
          } else {
            nextValue = [itemValue];
          }
        } else {
          nextValue = isOpen
            ? selectedValue.filter(
                (currentValue) => currentValue !== itemValue
              )
            : [...selectedValue, itemValue];
        }

        if (!isControlled) {
          setInternalValue(nextValue);
        }

        if (type === "single") {
          onValueChange?.(nextValue[0]);
        } else {
          onValueChange?.(nextValue);
        }
      },
      [
        disabled,
        selectedValue,
        type,
        isCollapsible,
        isControlled,
        onValueChange,
      ]
    );

    const contextValue = useMemo(
      () => ({
        type,
        value: selectedValue,
        disabled,
        collapsible: isCollapsible,
        baseId: generatedId,
        onItemToggle: handleItemToggle,
      }),
      [
        type,
        selectedValue,
        disabled,
        isCollapsible,
        generatedId,
        handleItemToggle,
      ]
    );

    const classNames = [styles.root, className]
      .filter(Boolean)
      .join(" ");

    return (
      <AccordionContext.Provider value={contextValue}>
        <div
          {...rootProps}
          ref={forwardedRef}
          data-accordion-root=""
          data-type={type}
          data-disabled={disabled || undefined}
          className={classNames}
        >
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);

Accordion.displayName = "Accordion";
