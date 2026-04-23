export type DialogueSide = "left" | "right";
export type DialogueMessageStatus = "pending" | "sent" | "seen";

export interface DialogueMessage {
  id: string;
  side: DialogueSide;
  text: string;
  characterId?: string;
  characterName?: string;
  avatar?: string;
  avatarLabel?: string;
  themeColor?: string;
  timestamp?: string;
  status?: DialogueMessageStatus;
}
