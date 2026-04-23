import type { DialogueLine } from "../model/types";
import { DialogueRow } from "./DialogueRow";

interface DialogueListProps {
  lines: DialogueLine[];
}

export function DialogueList({ lines }: DialogueListProps) {
  if (!lines.length) {
    return <p className="dialogue-list__empty">This chapter does not have parsed dialogue yet.</p>;
  }

  return (
    <ol className="dialogue-list">
      {lines.map((line) => (
        <DialogueRow key={line.id} line={line} />
      ))}
    </ol>
  );
}
