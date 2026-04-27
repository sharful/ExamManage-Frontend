import { cn } from "@/lib/utils";

type LogoMarkProps = {
  size?: number;
  className?: string;
};

export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="#F0FDF4" />
      <rect x="6" y="9" width="20" height="17" rx="3" fill="#16A34A" />
      <rect x="6" y="9" width="20" height="5" rx="3" fill="#15803D" />
      <rect x="10" y="5" width="3" height="6" rx="1.5" fill="#15803D" />
      <rect x="19" y="5" width="3" height="6" rx="1.5" fill="#15803D" />
      <rect x="9" y="17" width="4" height="4" rx="1" fill="rgba(255,255,255,0.5)" />
      <rect x="14" y="17" width="4" height="4" rx="1" fill="rgba(255,255,255,0.5)" />
      <rect x="19" y="17" width="4" height="4" rx="1" fill="#ffffff" />
      <circle cx="24" cy="24" r="6" fill="#22C55E" stroke="#ffffff" strokeWidth="1.5" />
      <path
        d="M21.5 24l1.8 1.8 3.2-3"
        stroke="#ffffff"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type WordmarkProps = {
  className?: string;
};

export function Wordmark({ className }: WordmarkProps) {
  return (
    <span
      className={cn(
        "text-display font-bold tracking-tight whitespace-nowrap",
        className
      )}
    >
      <span className="text-foreground">Exam</span>
      <span className="text-primary">Manage</span>
    </span>
  );
}

type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  tagline?: boolean;
  className?: string;
};

export function Logo({
  size = 32,
  showWordmark = true,
  tagline = false,
  className,
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <Wordmark className="text-base" />
          {tagline && (
            <span className="mt-1 text-[11px] font-medium tracking-wide text-muted-foreground">
              Plan. Prepare. Perform.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
