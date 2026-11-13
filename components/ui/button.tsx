// import * as React from "react"
// import { cva, type VariantProps } from "class-variance-authority"
// import { Slot } from "radix-ui"

// import { cn } from "@/lib/utils"

// const buttonVariants = cva(
//   "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
//   {
//     variants: {
//       variant: {
//         default: "bg-primary text-primary-foreground hover:bg-primary/90",
//         destructive:
//           "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
//         outline:
//           "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
//         secondary:
//           "bg-secondary text-secondary-foreground hover:bg-secondary/80",
//         ghost:
//           "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
//         link: "text-primary underline-offset-4 hover:underline",
//       },
//       size: {
//         default: "h-9 px-4 py-2 has-[>svg]:px-3",
//         xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
//         sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
//         lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
//         icon: "size-9",
//         "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
//         "icon-sm": "size-8",
//         "icon-lg": "size-10",
//       },
//     },
//     defaultVariants: {
//       variant: "default",
//       size: "default",
//     },
//   }
// )

// function Button({
//   className,
//   variant = "default",
//   size = "default",
//   asChild = false,
//   ...props
// }: React.ComponentProps<"button"> &
//   VariantProps<typeof buttonVariants> & {
//     asChild?: boolean
//   }) {
//   const Comp = asChild ? Slot.Root : "button"

//   return (
//     <Comp
//       data-slot="button"
//       data-variant={variant}
//       data-size={size}
//       className={cn(buttonVariants({ variant, size, className }))}
//       {...props}
//     />
//   )
// }

// export { Button, buttonVariants }

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 cursor-pointer rounded-lg text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 outline-none select-none active:translate-y-px active:scale-[0.98] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:saturate-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "accent-gradient-bg border border-cyan-300/60 text-slate-950 shadow-[0_0_14px_-2px_color-mix(in_oklab,var(--accent-400)_65%,transparent)] hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_22px_0_color-mix(in_oklab,var(--accent-400)_80%,transparent)]",
        destructive:
          "border border-red-400/60 bg-red-600/80 text-white shadow-[0_0_14px_-2px_rgba(239,68,68,0.6)] hover:-translate-y-0.5 hover:bg-red-500 hover:shadow-[0_0_22px_0_rgba(239,68,68,0.75)] focus-visible:ring-red-500/30",
        outline:
          "border border-cyan-400/60 bg-cyan-500/10 text-cyan-300 shadow-[0_0_12px_-4px_color-mix(in_oklab,var(--accent-400)_60%,transparent)] hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-100 hover:shadow-[0_0_20px_-2px_color-mix(in_oklab,var(--accent-400)_75%,transparent)]",
        secondary:
          "border border-fuchsia-400/50 bg-fuchsia-500/10 text-fuchsia-300 hover:-translate-y-0.5 hover:bg-fuchsia-500/20 hover:shadow-[0_0_18px_-2px_color-mix(in_oklab,var(--accent-alt)_70%,transparent)]",
        ghost:
          "border border-transparent text-cyan-300 hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-100",
        link: "text-cyan-300 underline-offset-4 hover:text-cyan-100 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-lg px-5 has-[>svg]:px-2.5",
        lg: "h-11 rounded-lg px-7 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
