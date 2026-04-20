import * as React from "react"
import { cn } from "@/lib/utils"

function Card({
  className,
  variant = "glass",
  ...props
}: React.ComponentProps<"div"> & { variant?: "default" | "glass" | "outline" }) {
  return (
    <div
      data-slot="card"
      className={cn(
        "group/card flex flex-col overflow-hidden transition-all duration-500",
        variant === "glass" && "glass-card rounded-[2rem]",
        variant === "default" && "bg-card rounded-2xl shadow-lg border border-border",
        variant === "outline" && "border-2 border-slate-200 dark:border-white/5 bg-transparent rounded-2xl",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col space-y-1.5 p-6 pb-4",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-outfit text-xl font-black uppercase tracking-tighter text-gradient",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-xs font-medium text-muted-foreground uppercase tracking-widest", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-6 pt-0", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center p-6 pt-0 border-t border-white/5 mt-4",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}
