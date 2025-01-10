import * as React from "react"

import { cn } from "@/app/_components/common/utils"
import { Label } from "./Label"

export interface NewInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string,
  labelPosition?: "top" | "left",
  error?: string,
  parentClassName?: string,
}

const NewInput = React.forwardRef<HTMLInputElement, NewInputProps>(
  ({ className, type, label, labelPosition, ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex flex-col",
          props.error ? "" : "",
          props.parentClassName,
        )}
        style={{
          display: "flex",
          flexDirection: labelPosition === "left" ? "row" : "column",
          columnGap: labelPosition === "left" ? "4px" : "0",
          rowGap: labelPosition === "left" ? "0" : "4px"
        }}
      >
        {label && (
          <Label>
            {label}
          </Label>
        )}
        <div className="flex flex-col">
          <input
            type={type}
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            ref={ref}
            {...props}
          />
          {props.error && (
            <div className="text-sm text-red-500">{props.error}</div>
          )}
        </div>
      </div>
    )
  }
)
NewInput.displayName = "Input"

export { NewInput }

