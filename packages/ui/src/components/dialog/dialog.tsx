"use client";

import {
  forwardRef,
  useCallback,
  useId,
  useLayoutEffect,
  useState,
} from "react";
import type {
  MouseEvent,
  Ref,
  SyntheticEvent,
} from "react";

import { OverlayPortalContext } from "../../internal/overlay-portal-context";
import type { DialogProps } from "./dialog.types";
import styles from "./dialog.module.css";

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

export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(
  (
    {
      open,
      onOpenChange,
      title,
      description,
      size = "medium",
      closeOnEscape = true,
      closeOnOutsideClick = false,
      showCloseButton = true,
      children,
      className,
      ...props
    },
    forwardedRef
  ) => {
    const titleId = useId();
    const descriptionId = useId();

    const [dialogElement, setDialogElement] =
      useState<HTMLDialogElement | null>(null);

    const [portalRoot, setPortalRoot] =
      useState<HTMLDivElement | null>(null);

    const setDialogRef = useCallback(
      (node: HTMLDialogElement | null) => {
        setDialogElement(node);

        const cleanup = assignRef(forwardedRef, node);

        if (node === null) {
          return;
        }

        return () => {
          if (typeof cleanup === "function") {
            cleanup();
          } else {
            assignRef(forwardedRef, null);
          }

          setDialogElement(null);
        };
      },
      [forwardedRef]
    );

    useLayoutEffect(() => {
      if (!dialogElement) {
        return;
      }

      if (open && !dialogElement.open) {
        dialogElement.showModal();
      } else if (!open && dialogElement.open) {
        dialogElement.close();
      }
    }, [dialogElement, open]);

    const handleCancel = (
      event: SyntheticEvent<HTMLDialogElement>
    ) => {
      event.preventDefault();

      if (closeOnEscape) {
        onOpenChange(false);
      }
    };

    const handleClose = () => {
      if (open) {
        onOpenChange(false);
      }
    };

    const handleClick = (
      event: MouseEvent<HTMLDialogElement>
    ) => {
      if (
        closeOnOutsideClick &&
        event.target === event.currentTarget
      ) {
        onOpenChange(false);
      }
    };

    const dialogClassNames = [
      styles.dialog,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <dialog
        ref={setDialogRef}
        className={dialogClassNames}
        data-size={size}
        aria-labelledby={titleId}
        aria-describedby={
          description != null ? descriptionId : undefined
        }
        onCancel={handleCancel}
        onClose={handleClose}
        onClick={handleClick}
        {...props}
      >
        <OverlayPortalContext.Provider value={portalRoot}>
          <section className={styles.surface}>
            <header className={styles.header}>
              <div className={styles.heading}>
                <h2
                  id={titleId}
                  className={styles.title}
                >
                  {title}
                </h2>

                {description != null && (
                  <p
                    id={descriptionId}
                    className={styles.description}
                  >
                    {description}
                  </p>
                )}
              </div>

              {showCloseButton && (
                <button
                  type="button"
                  className={styles.closeButton}
                  aria-label="Close dialog"
                  onClick={() => onOpenChange(false)}
                >
                  <span aria-hidden="true">×</span>
                </button>
              )}
            </header>

            <div className={styles.content}>
              {children}
            </div>
          </section>

          <div
            ref={setPortalRoot}
            className={styles.portalRoot}
          />
        </OverlayPortalContext.Provider>
      </dialog>
    );
  }
);

Dialog.displayName = "Dialog";
