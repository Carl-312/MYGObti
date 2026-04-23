import type {
  Question,
  QuestionOption,
  QuizAnswerRecord,
} from "@mygobti/quiz-core";
import type { DialogueMessage } from "../../../shared/ui/dialogue";

export interface PendingChatSelection {
  optionId: string;
  questionIndex: number;
}

export interface ChatRevisionEntry {
  answerText: string;
  isCurrent: boolean;
  prompt: string;
  questionIndex: number;
  questionOrder: number;
}

export interface QuizChatScene {
  answeredCount: number;
  firstUnansweredIndex: number;
  messages: DialogueMessage[];
  revisionEntries: ChatRevisionEntry[];
}

const QUESTION_SPEAKER = {
  characterId: "anon",
  characterName: "系统提问",
} as const;

const SCENE_SPEAKER = {
  characterId: "sakiko",
  characterName: "事件记录",
} as const;

const REVISION_SPEAKER = {
  characterId: "mutsumi",
  characterName: "修订提示",
} as const;

const NOTICE_SPEAKER = {
  characterId: "taki",
  characterName: "补答提醒",
} as const;

function formatTimestamp(questionIndex: number, offset = 0): string {
  const minuteValue = 9 + questionIndex * 3 + offset;
  const minutes = String(minuteValue % 60).padStart(2, "0");

  return `23:${minutes}`;
}

function getAnswerText(
  question: Question,
  answer: QuizAnswerRecord,
): string {
  return (
    question.options.find((option) => option.id === answer.optionId)?.text ??
    answer.optionId
  );
}

export function getChoiceMessageId(
  question: Question,
  option: Pick<QuestionOption, "id">,
): string {
  return `${question.id}::choice::${option.id}`;
}

function createQuestionMessages(
  question: Question,
  questionIndex: number,
): DialogueMessage[] {
  return [
    {
      id: `${question.id}::scene`,
      side: "left",
      text: question.sceneHint,
      timestamp: formatTimestamp(questionIndex),
      ...SCENE_SPEAKER,
    },
    {
      id: `${question.id}::prompt`,
      side: "left",
      text: `**Q${String(question.order).padStart(2, "0")}** ${question.prompt}`,
      timestamp: formatTimestamp(questionIndex, 1),
      ...QUESTION_SPEAKER,
    },
  ];
}

function createRecordedAnswerMessage(
  question: Question,
  answer: QuizAnswerRecord,
  questionIndex: number,
): DialogueMessage {
  return {
    id: `${question.id}::answer::${answer.optionId}`,
    side: "right",
    text: getAnswerText(question, answer),
    timestamp: formatTimestamp(questionIndex, 2),
    status: "seen",
    characterId: "tomori",
    avatarLabel: "你",
  };
}

function createChoiceMessages(question: Question): DialogueMessage[] {
  return question.options.map((option) => ({
    id: getChoiceMessageId(question, option),
    side: "right",
    text: option.text,
    status: "pending",
    characterId: "tomori",
    avatarLabel: "你",
  }));
}

export function createQuizChatScene(args: {
  answers: Array<QuizAnswerRecord | null>;
  currentQuestionIndex: number;
  pendingSelection: PendingChatSelection | null;
  questions: Question[];
  submitMessage: string | null;
}): QuizChatScene {
  const { answers, currentQuestionIndex, pendingSelection, questions, submitMessage } =
    args;
  const answeredCount = answers.filter((answer) => answer !== null).length;
  const firstUnansweredIndex = answers.findIndex((answer) => answer === null);
  const revisionEntries: ChatRevisionEntry[] = [];
  const messages: DialogueMessage[] = [];

  questions.forEach((question, questionIndex) => {
    if (questionIndex > currentQuestionIndex) {
      return;
    }

    messages.push(...createQuestionMessages(question, questionIndex));

    const answer = answers[questionIndex];
    const isCurrentQuestion = questionIndex === currentQuestionIndex;
    const isPendingQuestion = pendingSelection?.questionIndex === questionIndex;

    if (!isCurrentQuestion && answer) {
      messages.push(createRecordedAnswerMessage(question, answer, questionIndex));
      revisionEntries.push({
        answerText: getAnswerText(question, answer),
        isCurrent: false,
        prompt: question.prompt,
        questionIndex,
        questionOrder: question.order,
      });
      return;
    }

    if (isCurrentQuestion && answer && !isPendingQuestion) {
      messages.push(createRecordedAnswerMessage(question, answer, questionIndex));
      messages.push({
        id: `${question.id}::revision-tip`,
        side: "left",
        text: "上一版回答已经记下来了。要改答案，就像重新发消息一样再选一次。",
        timestamp: formatTimestamp(questionIndex, 3),
        ...REVISION_SPEAKER,
      });
      revisionEntries.push({
        answerText: getAnswerText(question, answer),
        isCurrent: true,
        prompt: question.prompt,
        questionIndex,
        questionOrder: question.order,
      });
    }

    messages.push(...createChoiceMessages(question));
  });

  if (submitMessage) {
    messages.push({
      id: `submit-notice-${currentQuestionIndex}`,
      side: "left",
      text: submitMessage,
      timestamp: formatTimestamp(currentQuestionIndex, 4),
      ...NOTICE_SPEAKER,
    });
  }

  return {
    answeredCount,
    firstUnansweredIndex,
    messages,
    revisionEntries,
  };
}
