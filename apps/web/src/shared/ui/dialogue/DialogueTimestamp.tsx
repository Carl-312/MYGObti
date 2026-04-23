import type { ReactNode } from "react";

interface DialogueTimestampProps {
  children?: ReactNode;
}

export function DialogueTimestamp({ children }: DialogueTimestampProps) {
  if (!children) {
    return null;
  }

  return <p className="dialogue-timestamp">{children}</p>;
}
