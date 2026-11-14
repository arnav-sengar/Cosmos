"use client";

import {
  forwardRef,
  useId,
  useMemo,
} from "react";

import type { AccordionItemProps } from "./accordion.types";

import {
  AccordionItemContext,
  useAccordionContext,
} from "./accordion.context";

import styles from "./accordion.module.css";

export const AccordionItem = forwardRef<
  HTMLDivElement,
  AccordionItemProps
>(
  (
    {
      value,
      disabled = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const accordion = useAccordionContext();

    const isDisabled = accordion.disabled || disabled;
    const isOpen = accordion.value.includes(value);

    const itemContext = useMemo(
      () => ({
        value,
        disabled: isDisabled,
        triggerId: `${accordion.baseId}-trigger-${generatedId}`,
        contentId: `${accordion.baseId}-content-${generatedId}`,
      }),
      [
        value,
        isDisabled,
        accordion.baseId,
        generatedId,
      ]
    );

    const classNames = [
      styles.item,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <AccordionItemContext.Provider value={itemContext}>
        <div
          {...props}
          ref={ref}
          data-state={isOpen ? "open" : "closed"}
          data-disabled={isDisabled || undefined}
          data-value={value}
          className={classNames}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);

AccordionItem.displayName = "AccordionItem";
