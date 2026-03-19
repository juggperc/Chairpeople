import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:translate-y-[-1px] hover:shadow-lg active:translate-y-0 active:shadow-md',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:translate-y-[-1px] hover:shadow-lg active:translate-y-0 active:shadow-md',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:translate-y-[-1px] hover:shadow-lg active:translate-y-0 active:shadow-md',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:translate-y-[-1px] hover:shadow-lg active:translate-y-0 active:shadow-md',
        ghost: 'hover:bg-accent hover:text-accent-foreground hover:translate-y-[-1px] hover:shadow-md active:translate-y-0',
        link: 'text-primary underline-offset-4 hover:underline',
        shimmer: 'bg-primary text-primary-foreground relative overflow-hidden',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  shimmer?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, shimmer: showShimmer, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {props.children}
        {showShimmer && variant === 'shimmer' && (
          <span className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };