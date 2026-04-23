import type {
  CharacterProfile,
  Question,
  QuizContentSnapshot,
  QuizMeta,
  QuizMetaResponse,
} from "@mygobti/quiz-core";
import {
  buildCharacters,
  getPublicCharacters,
} from "../../character/model/characters";

export interface RuntimeQuizContent {
  meta: QuizMetaResponse;
  content: QuizContentSnapshot;
  quizMeta: QuizMeta;
  questions: Question[];
  characters: CharacterProfile[];
  publicCharacters: CharacterProfile[];
}

export function createRuntimeQuizContent(
  meta: QuizMetaResponse,
  content: QuizContentSnapshot,
): RuntimeQuizContent {
  if (meta.version !== content.version) {
    throw new Error(
      `内容服务版本不一致：meta=${meta.version}, content=${content.version}`,
    );
  }

  const characters = buildCharacters(content.characters);

  return {
    meta,
    content,
    quizMeta: content.quizMeta,
    questions: content.questions,
    characters,
    publicCharacters: getPublicCharacters(characters),
  };
}
