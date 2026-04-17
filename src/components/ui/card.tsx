import { cn } from "@/lib/utils";

type CardTone = "cream" | "pink" | "peach" | "lavender" | "mint" | "amber";

const toneClasses: Record<CardTone, string> = {
  cream: "bg-card text-card-foreground",
  pink: "bg-pastel-pink text-pastel-fg border-transparent",
  peach: "bg-pastel-peach text-pastel-fg border-transparent",
  lavender: "bg-pastel-lavender text-pastel-fg border-transparent",
  mint: "bg-pastel-mint text-pastel-fg border-transparent",
  amber: "bg-pastel-amber text-pastel-fg border-transparent",
};

function Card({
  className,
  tone = "cream",
  ...props
}: React.ComponentProps<"div"> & { tone?: CardTone }) {
  return (
    <div
      data-slot="card"
      data-tone={tone}
      className={cn(
        "rounded-2xl border border-border shadow-sm",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5 p-6", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-6 pt-0", className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
export type { CardTone };
