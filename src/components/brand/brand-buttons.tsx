import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type BrandButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary";
};

export const BrandButton = React.forwardRef<HTMLButtonElement, BrandButtonProps>(
  ({ asChild = false, variant = "primary", className, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-6 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-df-yellow disabled:pointer-events-none disabled:opacity-60",
          variant === "primary"
            ? "border-df-green bg-df-green text-white shadow-[0_8px_18px_rgba(31,77,55,0.18)] hover:bg-[#173B2A]"
            : "border-df-green bg-df-card text-df-green hover:bg-df-cream",
          className,
        )}
        {...props}
      />
    );
  },
);

BrandButton.displayName = "BrandButton";
