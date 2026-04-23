import type { DialogueGroup, StoryScene } from "../model/types";
import { DialogueList } from "./DialogueList";

interface SceneSectionProps {
  groups: DialogueGroup[];
  scene: StoryScene;
}

export function SceneSection({ groups, scene }: SceneSectionProps) {
  return (
    <section className="band-story-scene">
      <header className="band-story-scene__header">
        <div>
          <p className="band-story-scene__eyebrow">
            {scene.sceneType === "flashback" ? "Opening Beat" : "Scene"}
          </p>
          <h3>{scene.title}</h3>
        </div>
        <span className="band-story-scene__count">{scene.lineCount} lines</span>
      </header>

      <div className="band-story-scene__groups">
        {groups.map((group) => (
          <article className="band-story-group" key={group.id}>
            <div className="band-story-group__header">
              <div>
                <p className="band-story-group__eyebrow">
                  {group.kind === "flashback"
                    ? "Flashback"
                    : group.kind === "inner-monologue"
                      ? "Inner Voice"
                      : "Dialogue Block"}
                </p>
                <h4>{group.title}</h4>
              </div>
              <span className="band-story-group__count">{group.lineCount} lines</span>
            </div>

            {group.speakers.length ? (
              <div className="band-story-group__speakers" aria-label="Group speakers">
                {group.speakers.map((speaker) => (
                  <span className="band-story-group__speaker" key={speaker}>
                    {speaker}
                  </span>
                ))}
              </div>
            ) : null}

            <DialogueList lines={group.lines} />
          </article>
        ))}
      </div>
    </section>
  );
}
