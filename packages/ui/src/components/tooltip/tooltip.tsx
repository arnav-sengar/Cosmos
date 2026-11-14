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
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";

import { OverlayPortalContext } from "../../internal/overlay-portal-context";
import type { TooltipProps } from "./tooltip.types";
import styles from "./tooltip.module.css";

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

export function Tooltip({
  content,
  children,
  placement = "top",
  openDelay = 500,
  closeDelay = 100,
  disabled = false,
}: TooltipProps) {
  const portalRoot = useContext(OverlayPortalContext);

  const [openState, setOpenState] = useState({
    disabled,
    value: false,
  });

  if (openState.disabled !== disabled) {
    setOpenState({
      disabled,
      value: false,
    });
  }

  const isOpen = !disabled && openState.value;

  const {
    refs: {
      setReference,
      setFloating,
    },
    floatingStyles,
    context,
  } = useFloating({
    open: isOpen,
    onOpenChange: (nextOpen) => {
      setOpenState({
        disabled,
        value: nextOpen,
      });
    },
    placement,
    strategy: portalRoot ? "fixed" : "absolute",
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    enabled: !disabled,
    mouseOnly: true,
    move: false,
    delay: {
      open: Math.max(0, openDelay),
      close: Math.max(0, closeDelay),
    },
  });

  const focus = useFocus(context, {
    enabled: !disabled,
    visibleOnly: true,
  });

  const dismiss = useDismiss(context, {
    enabled: !disabled,
    escapeKey: true,
    outsidePress: true,
    referencePress: false,
    ancestorScroll: true,
  });

  const role = useRole(context, {
    enabled: !disabled,
    role: "tooltip",
  });

  const {
    getReferenceProps,
    getFloatingProps,
  } = useInteractions([
    hover,
    focus,
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
    }
  );

  return (
    <>
      {trigger}

      {isOpen && portalRoot !== null && (
        <FloatingPortal root={portalRoot}>
          <div
            {...getFloatingProps({
              className: styles.tooltip,
              style: floatingStyles,
            })}
            ref={setFloating}
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
