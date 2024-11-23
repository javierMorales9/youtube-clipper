import { forwardRef } from "react";
import { cn } from "./utils";

interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> { type: "h1" | "h2" | "h3" | "h4" };

const Title = forwardRef<HTMLHeadingElement, TitleProps>(
  ({ className, ...props }, ref) => (
    <>
      {props.type === "h1" && <h1 ref={ref} className={cn("text-2xl font-bold", className)} {...props} />}
      {props.type === "h2" && <h2 ref={ref} className={cn("text-xl font-semibold", className)} {...props} />}
      {props.type === "h3" && <h3 ref={ref} className={cn("text-lg font-semibold", className)} {...props} />}
      {props.type === "h4" && <h4 ref={ref} className={cn("text-base font-medium", className)} {...props} />}
    </>
  )
)

Title.displayName = "Title";

export { Title };
