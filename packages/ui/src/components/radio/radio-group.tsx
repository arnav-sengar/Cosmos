"use client";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useState,
} from "react";
import type { RadioGroupProps } from "./radio.types";
import styles from "./radio.module.css";

interface RadioGroupContextValue {
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled: boolean;
  required: boolean;
  size: "small" | "medium" | "large";
  describedBy?: string;
  invalid: RadioGroupProps["aria-invalid"];
}

const RadioGroupContext =
  createContext<RadioGroupContextValue | null>(null);

export function useRadioGroupContext() {
  const context = useContext(RadioGroupContext);

  if (!context) {
    throw new Error(
      "Radio must be used within a RadioGroup."
    );
  }

  return context;
}

export const RadioGroup = forwardRef<
  HTMLFieldSetElement,
  RadioGroupProps
>(
  (
    {
      label,
      name,
      value,
      defaultValue,
      onValueChange,
      orientation = "vertical",
      size = "medium",
      helperText,
      errorMessage,
      disabled = false,
      required = false,
      id,
      className,
      children,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const groupId = id ?? generatedId;
    const messageId = `${groupId}-message`;

    const [internalValue, setInternalValue] = useState(
      defaultValue ?? ""
    );

    const isControlled = value !== undefined;
    const selectedValue = isControlled
      ? value
      : internalValue;

    const hasError = errorMessage != null;
    const message = hasError ? errorMessage : helperText;
    const hasMessage = message != null;

    const describedBy = [
      ariaDescribedBy,
      hasMessage ? messageId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    const handleValueChange = useCallback(
      (nextValue: string) => {
        if (!isControlled) {
          setInternalValue(nextValue);
        }

        onValueChange?.(nextValue);
      },
      [isControlled, onValueChange]
    );

    const contextValue: RadioGroupContextValue = {
      name,
      value: selectedValue,
      onValueChange: handleValueChange,
      disabled,
      required,
      size,
      describedBy,
      invalid: hasError ? true : ariaInvalid,
    };

    const groupClassNames = [
      styles.group,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const optionsClassNames = [
      styles.options,
      styles[orientation],
    ].join(" ");

    return (
      <RadioGroupContext.Provider value={contextValue}>
        <fieldset
          ref={ref}
          id={groupId}
          className={groupClassNames}
          disabled={disabled}
          aria-describedby={describedBy}
          aria-invalid={hasError ? true : ariaInvalid}
          {...props}
        >
          <legend className={styles.legend}>
            {label}
            {required && (
              <span aria-hidden="true"> *</span>
            )}
          </legend>

          <div className={optionsClassNames}>
            {children}
          </div>

          {hasMessage && (
            <div
              id={messageId}
              className={
                hasError
                  ? styles.errorMessage
                  : styles.helperText
              }
              role={hasError ? "alert" : undefined}
            >
              {message}
            </div>
          )}
        </fieldset>
      </RadioGroupContext.Provider>
    );
  }
);

RadioGroup.displayName = "RadioGroup";
