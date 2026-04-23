import type { DialogueLine } from "../model/types";

interface DialogueRowProps {
  line: DialogueLine;
}

export function DialogueRow({ line }: DialogueRowProps) {
  return (
    <li className={`dialogue-row${line.isThought ? " dialogue-row--thought" : ""}`}>
      <div className="dialogue-row__avatar" aria-hidden="true">
        {line.avatarLabel}
      </div>

      <article className="dialogue-row__card">
        <div className="dialogue-row__meta">
          <strong>{line.speaker}</strong>
          {line.isThought ? (
            <span className="dialogue-row__meta-note">Inner voice</span>
          ) : null}
        </div>
        <p>{line.text}</p>
      </article>
    </li>
  );
}
