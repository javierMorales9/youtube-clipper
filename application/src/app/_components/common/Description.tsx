import { forwardRef } from "react";
import { cn } from "./utils";

interface DescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {};

const Description = forwardRef<HTMLHeadingElement, DescriptionProps>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-base text-muted-foreground", className)} {...props} />
  )
)

Description.displayName = "Description";

export {Description}
