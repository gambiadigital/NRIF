import Link from "next/link";
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

const VARIANTS = {
  primary:
    "bg-forest text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(11_27_58/0.2),0_8px_20px_-10px_rgb(19_95_64/0.7)] hover:bg-forest-700",
  flag: "bg-ember text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_1px_2px_rgb(11_27_58/0.18),0_10px_24px_-12px_rgb(215_20_26/0.85)] hover:bg-ember-600",
  ink: "bg-navy text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_8px_20px_-12px_rgb(11_27_58/0.8)] hover:bg-navy-800",
  cobalt: "bg-cobalt text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.15),0_8px_20px_-12px_rgb(42_49_129/0.8)] hover:bg-cobalt-600",
  outline: "border border-forest/80 bg-white text-forest hover:bg-forest-50",
  line: "border border-line-strong bg-white text-navy hover:border-navy/40 hover:bg-paper",
  ghost: "text-navy hover:bg-navy/[0.06]",
  glass: "border border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/20",
  white: "bg-white text-navy shadow-[0_8px_24px_-12px_rgb(0_0_0/0.5)] hover:bg-paper",
  danger: "bg-ember text-white hover:bg-ember-600",
} as const;

const SIZES = {
  sm: "h-9 gap-1.5 px-3.5 text-[0.8125rem]",
  md: "h-11 gap-2 px-5 text-[0.9375rem]",
  lg: "h-[3.25rem] gap-2.5 px-6 text-base",
  xl: "h-16 gap-3 px-8 text-lg",
} as const;

type Common = {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  arrow?: boolean;
  icon?: ReactNode;
  block?: boolean;
  className?: string;
  children?: ReactNode;
};

export function buttonClass({ variant = "primary", size = "md", block, className }: Omit<Common, "children" | "icon" | "arrow">) {
  return cn(
    "group/btn relative inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-semibold tracking-[-0.005em] transition-[background-color,box-shadow,transform,border-color,color] duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45",
    VARIANTS[variant],
    SIZES[size],
    block && "w-full",
    className,
  );
}

function Inner({ icon, arrow, children }: Pick<Common, "icon" | "arrow" | "children">) {
  return (
    <>
      {icon}
      <span>{children}</span>
      {arrow && <ArrowRight weight="bold" className="size-[1.05em] transition-transform duration-300 ease-out group-hover/btn:translate-x-1" />}
    </>
  );
}

export const Button = forwardRef<HTMLButtonElement, Common & ComponentPropsWithoutRef<"button">>(function Button(
  { variant, size, arrow, icon, block, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass({ variant, size, block, className })} {...rest}>
      <Inner icon={icon} arrow={arrow}>
        {children}
      </Inner>
    </button>
  );
});

export function ButtonLink({
  href,
  variant,
  size,
  arrow,
  icon,
  block,
  className,
  children,
  ...rest
}: Common & { href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link href={href} className={buttonClass({ variant, size, block, className })} {...rest}>
      <Inner icon={icon} arrow={arrow}>
        {children}
      </Inner>
    </Link>
  );
}
