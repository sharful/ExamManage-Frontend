import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive/15 text-destructive",
        outline: "border-border text-foreground",
        success:
          "border-transparent bg-pastel-mint text-pastel-fg",
        warning:
          "border-transparent bg-pastel-amber text-pastel-fg",
        pink: "border-transparent bg-pastel-pink text-pastel-fg",
        peach: "border-transparent bg-pastel-peach text-pastel-fg",
        lavender: "border-transparent bg-pastel-lavender text-pastel-fg",
        mint: "border-transparent bg-pastel-mint text-pastel-fg",
        amber: "border-transparent bg-pastel-amber text-pastel-fg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
