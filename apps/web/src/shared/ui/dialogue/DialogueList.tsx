import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DialogueRow } from "./DialogueRow";
import type { DialogueMessage } from "./types";

interface DialogueListProps {
  autoScroll?: boolean;
  className?: string;
  messages: DialogueMessage[];
  onSelect?: (id: string) => void;
  selectedId?: string;
}

const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const choiceExit = {
  opacity: 0,
  x: 18,
  scale: 0.96,
  filter: "blur(3px)",
  transition: { duration: 0.22 },
};

export function DialogueList({
  autoScroll = true,
  className = "",
  messages,
  onSelect,
  selectedId,
}: DialogueListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [autoScroll, messages.length, selectedId]);

  function shouldShowAvatarAndName(index: number): boolean {
    if (index === 0) {
      return true;
    }

    const previous = messages[index - 1];
    const current = messages[index];
    return (
      previous.side !== current.side ||
      previous.characterId !== current.characterId ||
      previous.characterName !== current.characterName
    );
  }

  function getGap(index: number): number {
    if (index === 0) {
      return 0;
    }

    const previous = messages[index - 1];
    const current = messages[index];
    return previous.side === current.side ? 4 : 16;
  }

  return (
    <motion.div
      animate="visible"
      aria-label="对话记录"
      aria-live="polite"
      className={`dialogue-list${className ? ` ${className}` : ""}`}
      initial="hidden"
      role="log"
      variants={listVariants}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {messages.map((message, index) => {
          const gap = getGap(index);
          const showAvatarAndName = shouldShowAvatarAndName(index);
          const isChoice =
            message.side === "right" &&
            message.status !== "sent" &&
            message.status !== "seen";
          const isSelected = selectedId === message.id;
          const isOtherOptionSelected = selectedId !== undefined && isChoice;

          return (
            <motion.div
              className="dialogue-list__row-wrapper"
              exit={isChoice ? choiceExit : undefined}
              key={message.id}
              layout
              style={{ marginTop: gap }}
            >
              <DialogueRow
                isOtherOptionSelected={isOtherOptionSelected}
                isSelected={isChoice ? isSelected : undefined}
                message={message}
                onClick={onSelect}
                playSendAnimation={isSelected}
                showAvatar={showAvatarAndName}
                showName={showAvatarAndName}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div className="dialogue-list__bottom-anchor" ref={bottomRef} />
    </motion.div>
  );
}
