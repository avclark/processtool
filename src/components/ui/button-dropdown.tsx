// bm-design-system: button-dropdown primitive (split button + menu)
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Button, buttonVariants, type ButtonProps } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Variant = NonNullable<ButtonProps["variant"]>;
type Size = NonNullable<ButtonProps["size"]>;

export interface ButtonDropdownProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  action: React.ReactNode;
  children: React.ReactNode;
  variant?: Variant;
  size?: Exclude<Size, "icon">;
  toggleAriaLabel?: string;
  menuAlign?: "start" | "center" | "end";
  className?: string;
  toggleClassName?: string;
  wrapperClassName?: string;
}

const ButtonDropdown = React.forwardRef<HTMLButtonElement, ButtonDropdownProps>(
  (
    {
      action,
      children,
      variant = "primary",
      size = "md",
      toggleAriaLabel = "More actions",
      menuAlign = "end",
      className,
      toggleClassName,
      wrapperClassName,
      disabled,
      ...actionProps
    },
    ref,
  ) => {
    const toggleClasses = toggleClassName ?? className;
    return (
      <div className={cn("btn-dropdown", wrapperClassName)}>
        <Button
          ref={ref}
          variant={variant}
          size={size}
          disabled={disabled}
          className={cn("btn-dropdown-action", className)}
          {...actionProps}
        >
          {action}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={toggleAriaLabel}
              disabled={disabled}
              className={cn(
                buttonVariants({ variant, size }),
                "btn-dropdown-toggle",
                toggleClasses,
              )}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={menuAlign}>{children}</DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
);
ButtonDropdown.displayName = "ButtonDropdown";

export { ButtonDropdown };
