"use client";

import {
  cloneElement,
  useCallback,
  useContext,
  useState,
} from "react";
import type {
  HTMLProps,
  ReactElement,
  Ref,
} from "react";

import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";

import { OverlayPortalContext } from "../../internal/overlay-portal-context";
import type { PopoverProps } from "./popover.types";
import styles from "./popover.module.css";

function assignRef<T>(
  ref: Ref<T> | undefined,
  node: T | null
): void | (() => void) {
  if (typeof ref === "function") {
    return ref(node);
  }

  if (ref) {
    (ref as { current: T | null }).current = node;
  }
}

export function Popover({
  content,
  children,
  label,
  placement = "bottom",
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  closeOnEscape = true,
  closeOnOutsideClick = true,
}: PopoverProps) {
  const portalRoot = useContext(OverlayPortalContext);

  const [uncontrolledOpen, setUncontrolledOpen] =
    useState(defaultOpen);

  const isControlled = controlledOpen !== undefined;
  const isOpen = !disabled && (
    isControlled ? controlledOpen : uncontrolledOpen
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  const {
    refs: {
      setReference,
      setFloating,
    },
    floatingStyles,
    context,
  } = useFloating({
    open: isOpen,
    onOpenChange: handleOpenChange,
    placement,
    strategy: portalRoot ? "fixed" : "absolute",
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context, {
    enabled: !disabled,
  });

  const dismiss = useDismiss(context, {
    enabled: !disabled,
    escapeKey: closeOnEscape,
    outsidePress: closeOnOutsideClick,
    referencePress: false,
    ancestorScroll: true,
  });

  const role = useRole(context, {
    enabled: !disabled,
    role: "dialog",
  });

  const {
    getReferenceProps,
    getFloatingProps,
  } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const childRef = (
    children.props as { ref?: Ref<HTMLElement> }
  ).ref;

  const mergedRef = useCallback(
    (node: HTMLElement | null) => {
      setReference(node);

      const cleanup = assignRef(childRef, node);

      if (node === null) {
        return;
      }

      return () => {
        if (typeof cleanup === "function") {
          cleanup();
        } else {
          assignRef(childRef, null);
        }

        setReference(null);
      };
    },
    [childRef, setReference]
  );

  const referenceProps = getReferenceProps(
    children.props as HTMLProps<HTMLElement>
  );

  const trigger = cloneElement(
    children as ReactElement<Record<string, unknown>>,
    {
      ...referenceProps,
      ref: mergedRef,
      "aria-haspopup": "dialog",
      "aria-expanded": isOpen,
    }
  );

  return (
    <>
      {trigger}

      {isOpen && portalRoot !== null && (
        <FloatingPortal root={portalRoot}>
          <FloatingFocusManager
            context={context}
            modal={false}
            initialFocus={0}
            returnFocus
          >
            <div
              {...getFloatingProps({
                className: styles.popover,
                style: floatingStyles,
                "aria-label": label,
              })}
              ref={setFloating}
            >
              {content}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}
