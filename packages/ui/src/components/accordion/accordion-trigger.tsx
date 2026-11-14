"use client";

import {
  createElement,
  forwardRef,
} from "react";

import type {
  MouseEvent,
} from "react";

import type {
  AccordionTriggerProps,
} from "./accordion.types";

import {
  useAccordionContext,
  useAccordionItemContext,
} from "./accordion.context";

import styles from "./accordion.module.css";

export const AccordionTrigger = forwardRef<
  HTMLButtonElement,
  AccordionTriggerProps
>(
  (
    {
      headingLevel = 3,
      children,
      className,
      disabled = false,
      onClick,
      ...props
    },
    ref
  ) => {
    const accordion = useAccordionContext();
    const item = useAccordionItemContext();

    const isDisabled =
      accordion.disabled ||
      item.disabled ||
      disabled;

    const isOpen = accordion.value.includes(item.value);

    const handleClick = (
      event: MouseEvent<HTMLButtonElement>
    ) => {
      onClick?.(event);

      if (!event.defaultPrevented && !isDisabled) {
        accordion.onItemToggle(item.value);
      }
    };

    const classNames = [
      styles.trigger,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return createElement(
      `h${headingLevel}`,
      { className: styles.heading },
      <button
        {...props}
        ref={ref}
        type="button"
        id={item.triggerId}
        aria-expanded={isOpen}
        aria-controls={item.contentId}
        disabled={isDisabled}
        data-state={isOpen ? "open" : "closed"}
        data-disabled={isDisabled || undefined}
        onClick={handleClick}
        className={classNames}
      >
        {children}
      </button>
    );
  }
);

AccordionTrigger.displayName = "AccordionTrigger";
