"use client";

import {
  forwardRef,
} from "react";

import type {
  AccordionContentProps,
} from "./accordion.types";

import {
  useAccordionContext,
  useAccordionItemContext,
} from "./accordion.context";

import styles from "./accordion.module.css";

export const AccordionContent = forwardRef<
  HTMLDivElement,
  AccordionContentProps
>(
  (
    {
      children,
      className,
      ...props
    },
    ref
  ) => {
    const accordion = useAccordionContext();
    const item = useAccordionItemContext();

    const isOpen = accordion.value.includes(item.value);

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
        id={item.contentId}
        role="region"
        aria-labelledby={item.triggerId}
        hidden={!isOpen}
        data-state={isOpen ? "open" : "closed"}
        className={classNames}
      >
        {children}
      </div>
    );
  }
);

AccordionContent.displayName = "AccordionContent";
