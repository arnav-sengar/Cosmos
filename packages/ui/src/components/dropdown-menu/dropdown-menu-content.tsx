"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import {
  useContext,
  useLayoutEffect,
  useRef,
} from "react";

import {
  FloatingFocusManager,
  FloatingList,
  FloatingPortal,
  useDismiss,
  useInteractions,
  useListNavigation,
  useRole,
  useTypeahead,
} from "@floating-ui/react";

import { OverlayPortalContext } from "../../internal/overlay-portal-context";
import { DropdownMenuContext } from "./dropdown-menu.context";
import type { DropdownMenuContentProps } from "./dropdown-menu.types";
import styles from "./dropdown-menu.module.css";

export function DropdownMenuContent({
  children,
  style,
  onKeyDown,
  className,
  ...props
}: DropdownMenuContentProps) {
  const menu = useContext(DropdownMenuContext);
  const portalRoot = useContext(OverlayPortalContext);

  if (!menu) {
    throw new Error(
      "DropdownMenuContent must be used within DropdownMenu."
    );
  }

  const {
    open,
    setOpen,
    activeIndex,
    setActiveIndex,
    initialFocus,
    floatingContext,
    setFloating,
    floatingStyles,
  } = menu;

  const elementsRef = useRef<Array<HTMLElement | null>>([]);
  const labelsRef = useRef<Array<string | null>>([]);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    const reference = floatingContext.refs.reference.current;

    returnFocusRef.current =
      reference instanceof HTMLElement ? reference : null;

    const enabledIndexes = elementsRef.current.reduce<number[]>(
      (indexes, element, index) => {
        if (
          element &&
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-disabled") !== "true"
        ) {
          indexes.push(index);
        }

        return indexes;
      },
      []
    );

    if (enabledIndexes.length === 0) {
      setActiveIndex(null);
      return;
    }

    setActiveIndex(
      initialFocus === "last"
        ? enabledIndexes[enabledIndexes.length - 1]
        : enabledIndexes[0]
    );
  }, [
    open,
    initialFocus,
    floatingContext,
    setActiveIndex,
  ]);

  const dismiss = useDismiss(floatingContext, {
    escapeKey: true,
    outsidePress: true,
    referencePress: false,
    ancestorScroll: true,
  });

  const role = useRole(floatingContext, {
    role: "menu",
  });

  const listNavigation = useListNavigation(floatingContext, {
    listRef: elementsRef,
    activeIndex,
    onNavigate: setActiveIndex,
    loop: true,
    focusItemOnOpen: true,
    focusItemOnHover: true,
    openOnArrowKeyDown: false,
  });

  const typeahead = useTypeahead(floatingContext, {
    listRef: labelsRef,
    activeIndex,
    onMatch: setActiveIndex,
    resetMs: 750,
  });

  const { getFloatingProps } = useInteractions([
    dismiss,
    role,
    listNavigation,
    typeahead,
  ]);

  if (!open || portalRoot === null) {
    return null;
  }

  const floatingProps = getFloatingProps({
    ...props,
    style: {
      ...floatingStyles,
      ...style,
    },
    onKeyDown: (event) => {
      onKeyDown?.(event as ReactKeyboardEvent<HTMLDivElement>);

      if (!event.defaultPrevented && event.key === "Tab") {
        returnFocusRef.current = null;
        setOpen(false);
      }
    },
  });

  return (
    <FloatingPortal root={portalRoot ?? undefined}>
      <FloatingFocusManager
        context={floatingContext}
        modal={false}
        returnFocus={returnFocusRef}
      >
        <FloatingList
          elementsRef={elementsRef}
          labelsRef={labelsRef}
        >
          <div
            {...floatingProps}
            ref={setFloating}
            className={[
              styles.content,
              className,
            ].filter(Boolean).join(" ")}
          >
            {children}
          </div>
        </FloatingList>
      </FloatingFocusManager>
    </FloatingPortal>
  );
}
