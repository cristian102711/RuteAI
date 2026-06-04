"use client";

import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import {
  fadeIn,
  slideUp,
  slideLeft,
  slideRight,
  scaleIn,
  staggerContainer,
  staggerContainerFast,
  pageTransition,
} from "./variants";

// ─── Shared viewport config ─────────────────────────────────────────────────
const VIEWPORT = { once: true, margin: "-60px" };

// ─── Types ───────────────────────────────────────────────────────────────────
type MotionDivProps = HTMLMotionProps<"div"> & {
  children: React.ReactNode;
  delay?: number;
  className?: string;
};

function withDelay(variants: Variants, delay = 0): Variants {
  if (delay === 0) return variants;
  return {
    ...variants,
    visible: {
      ...(variants.visible as object),
      transition: {
        ...((variants.visible as { transition?: object })?.transition ?? {}),
        delay,
      },
    },
  };
}

// ─── FadeIn ──────────────────────────────────────────────────────────────────
export function FadeIn({ children, delay = 0, className, ...props }: MotionDivProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={withDelay(fadeIn, delay)}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── SlideUp ─────────────────────────────────────────────────────────────────
export function SlideUp({ children, delay = 0, className, ...props }: MotionDivProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={withDelay(slideUp, delay)}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── SlideLeft ────────────────────────────────────────────────────────────────
export function SlideLeft({ children, delay = 0, className, ...props }: MotionDivProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={withDelay(slideLeft, delay)}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── SlideRight ───────────────────────────────────────────────────────────────
export function SlideRight({ children, delay = 0, className, ...props }: MotionDivProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={withDelay(slideRight, delay)}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── ScaleIn ─────────────────────────────────────────────────────────────────
export function ScaleIn({ children, delay = 0, className, ...props }: MotionDivProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={withDelay(scaleIn, delay)}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── StaggerChildren ─────────────────────────────────────────────────────────
// Wraps children so they animate in a cascade (each child should use motion.div
// or any motion element with a variant that has "hidden" / "visible").
export function StaggerChildren({
  children,
  delay = 0,
  fast = false,
  className,
  ...props
}: MotionDivProps & { fast?: boolean }) {
  const base = fast ? staggerContainerFast : staggerContainer;
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={withDelay(base, delay)}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── StaggerItem ─────────────────────────────────────────────────────────────
// Use as direct child of StaggerChildren. Uses slideUp by default.
export function StaggerItem({
  children,
  className,
  variants = slideUp,
  ...props
}: MotionDivProps & { variants?: Variants }) {
  return (
    <motion.div variants={variants} className={className} {...props}>
      {children}
    </motion.div>
  );
}

// ─── PageTransition ──────────────────────────────────────────────────────────
// Wrap page-level content inside layout for smooth enter/exit animations.
export function PageTransition({ children, className, ...props }: MotionDivProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={pageTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── MotionCard ──────────────────────────────────────────────────────────────
// Convenient card with hover lift effect.
export function MotionCard({ children, className, delay = 0, ...props }: MotionDivProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={withDelay(scaleIn, delay)}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
