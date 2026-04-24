import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePageShell } from "./PageShellContext";

const pageVariants = {
  initial: { opacity: 0, y: 20, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -12, filter: "blur(6px)" },
};

const pageTransition = {
  duration: 0.4,
  ease: "easeOut" as const,
};

export function PageTransition({ children }: { children: ReactNode }) {
  const { animationsEnabled, currentRoute } = usePageShell();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        animate="animate"
        className="page-shell__view"
        exit={animationsEnabled ? "exit" : "animate"}
        initial={animationsEnabled ? "initial" : "animate"}
        key={currentRoute}
        transition={animationsEnabled ? pageTransition : { duration: 0 }}
        variants={pageVariants}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
