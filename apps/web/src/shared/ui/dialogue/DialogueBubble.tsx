import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import type { DialogueSide } from "./types";

interface DialogueBubbleProps {
  side: DialogueSide;
  children: ReactNode;
  className?: string;
  isSelected?: boolean;
  onClick?: () => void;
  themeColor?: string;
}

const bubbleSelectVariants = {
  unselected: {
    scale: 1,
    boxShadow: "0 0 0 rgba(155,93,229,0)",
  },
  selected: {
    scale: 1,
    boxShadow: "0 0 18px rgba(155,93,229,0.28)",
    transition: { duration: 0.3 },
  },
};

function renderBubbleContent(children: ReactNode) {
  return <div className="dialogue-bubble__content">{children}</div>;
}

export function DialogueBubble({
  side,
  children,
  className = "",
  isSelected,
  onClick,
  themeColor,
}: DialogueBubbleProps) {
  const style = {
    "--dialogue-theme-color": themeColor ?? "rgba(155, 93, 229, 0.42)",
  } as CSSProperties;

  if (side === "left") {
    return (
      <div
        className={`dialogue-bubble dialogue-bubble--left${className ? ` ${className}` : ""}`}
        style={style}
      >
        {renderBubbleContent(children)}
      </div>
    );
  }

  const isSelectable = isSelected !== undefined;

  if (isSelectable) {
    return (
      <motion.button
        animate={isSelected ? "selected" : "unselected"}
        className={`dialogue-bubble dialogue-bubble--right dialogue-bubble--choice${className ? ` ${className}` : ""}`}
        initial="unselected"
        onClick={onClick}
        type="button"
        variants={bubbleSelectVariants}
        whileHover={
          isSelected
            ? {}
            : {
                boxShadow: "0 10px 20px rgba(155,93,229,0.12)",
                transition: { duration: 0.25 },
              }
        }
        whileTap={isSelected ? {} : { scale: 0.97 }}
      >
        {renderBubbleContent(children)}
      </motion.button>
    );
  }

  return (
    <div
      className={`dialogue-bubble dialogue-bubble--right dialogue-bubble--sent${className ? ` ${className}` : ""}`}
    >
      {renderBubbleContent(children)}
    </div>
  );
}
