import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-[0.55em] py-[0.12em] text-[0.85em] font-medium tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        pending: "bg-warning/10 text-warning",
        cleared: "bg-credit/10 text-credit",
        voided: "bg-muted text-muted-foreground",
        bounced: "bg-destructive/10 text-destructive",
        paid: "bg-credit/10 text-credit",
        sent: "bg-primary/10 text-primary",
        partial: "bg-warning/10 text-warning",
        draft: "bg-muted text-muted-foreground",
        overdue: "bg-destructive/10 text-destructive",
        internal: "bg-muted text-muted-foreground",
        reconciled: "bg-primary/10 text-primary",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
