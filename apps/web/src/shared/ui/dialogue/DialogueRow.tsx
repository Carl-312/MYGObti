import { motion } from "motion/react";
import { getCharacterAccent } from "../../../entities/character/model/characterAssets";
import { DialogueAvatar } from "./DialogueAvatar";
import { DialogueBubble } from "./DialogueBubble";
import "./dialogue.css";
import type { DialogueMessage } from "./types";

interface DialogueRowProps {
  className?: string;
  isOtherOptionSelected?: boolean;
  isSelected?: boolean;
  message: DialogueMessage;
  onClick?: (id: string) => void;
  playSendAnimation?: boolean;
  showAvatar?: boolean;
  showName?: boolean;
}

const sendAnimation = {
  initial: { scale: 1, x: 0, boxShadow: "0 0 0 rgba(155,93,229,0)" },
  animate: {
    scale: [1, 0.95, 1.02, 1],
    x: [0, 0, 8, 0],
    boxShadow: [
      "0 0 0 rgba(155,93,229,0)",
      "0 0 0 rgba(155,93,229,0)",
      "0 10px 24px rgba(155,93,229,0.26), 0 4px 10px rgba(241,91,181,0.16)",
      "0 0 0 rgba(155,93,229,0)",
    ],
    transition: {
      duration: 0.43,
      times: [0, 0.18, 0.53, 1],
    },
  },
};

const rowEntrance = {
  hidden: (side: "left" | "right") => ({
    opacity: 0,
    x: side === "left" ? -20 : 20,
    filter: "blur(4px)",
  }),
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.3 },
  },
};

function renderFormattedText(text: string) {
  return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

export function DialogueRow({
  className = "",
  isOtherOptionSelected,
  isSelected,
  message,
  onClick,
  playSendAnimation,
  showAvatar = true,
  showName = true,
}: DialogueRowProps) {
  const {
    avatar,
    avatarLabel,
    characterId,
    characterName,
    id,
    side,
    status,
    text,
    themeColor,
  } = message;
  const resolvedThemeColor =
    themeColor ?? (characterId ? getCharacterAccent(characterId) : "#8888aa");
  const isMuted =
    side === "right" &&
    Boolean(isOtherOptionSelected) &&
    !isSelected &&
    status !== "sent" &&
    status !== "seen";

  /* ── Choice option: no avatar, full-width stacked button ── */
  if (isSelected !== undefined) {
    return (
      <motion.div
        animate="visible"
        className={[
          "dialogue-row",
          "dialogue-row--choice-option",
          isMuted ? "dialogue-row--muted" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        custom="right"
        initial="hidden"
        role="listitem"
        variants={rowEntrance}
      >
        <motion.div
          animate={playSendAnimation && isSelected ? "animate" : "initial"}
          className="dialogue-row__choice-wrap"
          initial="initial"
          variants={sendAnimation}
        >
          <DialogueBubble
            isSelected={isSelected}
            onClick={() => onClick?.(id)}
            side="right"
            themeColor={resolvedThemeColor}
          >
            {renderFormattedText(text)}
          </DialogueBubble>
        </motion.div>
      </motion.div>
    );
  }

  /* ── Left side: scene / question messages ── */
  if (side === "left") {
    const rowClassName = ["dialogue-row", "dialogue-row--left", className]
      .filter(Boolean)
      .join(" ");

    return (
      <motion.div
        animate="visible"
        className={rowClassName}
        custom="left"
        initial="hidden"
        role="listitem"
        variants={rowEntrance}
      >
        <div className="dialogue-row__stack dialogue-row__stack--left">
          {showName && characterName ? (
            <div className="dialogue-row__divider">
              <span>{characterName}</span>
            </div>
          ) : null}
          <div className="dialogue-row__body dialogue-row__body--left">
            <DialogueAvatar
              characterId={characterId}
              label={avatarLabel ?? characterName}
              src={avatar}
              themeColor={resolvedThemeColor}
              visible={showAvatar}
            />
            <DialogueBubble side="left" themeColor={resolvedThemeColor}>
              {renderFormattedText(text)}
            </DialogueBubble>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── Right side: recorded sent/seen answer ── */
  const rowClassName = [
    "dialogue-row",
    "dialogue-row--right",
    isMuted ? "dialogue-row--muted" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.div
      animate="visible"
      className={rowClassName}
      custom="right"
      initial="hidden"
      role="listitem"
      variants={rowEntrance}
    >
      <motion.div
        animate={playSendAnimation && isSelected ? "animate" : "initial"}
        className="dialogue-row__stack dialogue-row__stack--right"
        initial="initial"
        variants={sendAnimation}
      >
        <div className="dialogue-row__body dialogue-row__body--right">
          <DialogueBubble
            isSelected={isSelected}
            onClick={() => onClick?.(id)}
            side="right"
            themeColor={resolvedThemeColor}
          >
            {renderFormattedText(text)}
          </DialogueBubble>
          <DialogueAvatar
            characterId={characterId}
            label={avatarLabel ?? characterName ?? "你"}
            src={avatar}
            themeColor={resolvedThemeColor}
            visible={showAvatar}
          />
        </div>
        {status === "seen" ? (
          <div className="dialogue-row__timestamp-row dialogue-row__timestamp-row--right">
            <span className="dialogue-row__seen">✓✓</span>
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
