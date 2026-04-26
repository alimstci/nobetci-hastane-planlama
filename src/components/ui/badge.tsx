import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 rounded-md border border-transparent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors focus:ring-2 focus:ring-primary/40",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border-primary/20",
        secondary: "bg-slate-900 dark:bg-white/10 text-white border-white/5",
        destructive: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        outline: "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 backdrop-blur-md",
        premium: "bg-primary text-primary-foreground border-primary",
        success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
