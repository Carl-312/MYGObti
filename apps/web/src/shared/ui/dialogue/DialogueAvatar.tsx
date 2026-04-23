import { CharacterRoundAvatar } from "../../../entities/character/ui";

interface DialogueAvatarProps {
  characterId?: string;
  label?: string;
  src?: string;
  themeColor?: string;
  visible?: boolean;
}

export function DialogueAvatar({
  characterId = "anon",
  label,
  src,
  visible = true,
}: DialogueAvatarProps) {
  if (!visible) {
    return <div aria-hidden="true" style={{ width: "2.75rem", height: "2.75rem" }} />;
  }

  return (
    <CharacterRoundAvatar
      characterId={characterId}
      decorative
      label={label}
      size="md"
      src={src}
    />
  );
}
