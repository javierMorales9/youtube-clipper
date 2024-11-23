import { forwardRef, useRef } from "react";
import { cn } from "./utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onChange, ...rest }, theRef) => {

    const error = null;
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const updateHeight = () => {
      const textArea = textAreaRef.current;
      if (textArea) {
        // We need to reset the height momentarily to get the correct scrollHeight for the textarea
        textArea.style.height = "0px";
        const scrollHeight = textArea.scrollHeight;

        // We then set the height directly, outside of the render loop
        // Trying to set this with state or a ref will product an incorrect value.
        textArea.style.height = scrollHeight + "px";
      }
    }

    return (
      <>
        {error && (
          <span className="text-red-700">{error}</span>
        )}
        <textarea
          {...rest}
          ref={(e) => {
            theRef && (theRef as (e: HTMLTextAreaElement | null) => void)(e);
            (textAreaRef as unknown as { current: HTMLTextAreaElement | null }).current = e;
          }}
          onChange={(e) => {
            onChange && onChange(e);
            updateHeight();
          }}
          className={cn(
            "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        />
      </>
    );
  })

Textarea.displayName = "Textarea";

export default Textarea;
