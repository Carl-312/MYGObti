import { describe, expect, it } from "vitest";
import type { Question, QuizAnswerRecord } from "@mygobti/quiz-core";
import {
  createQuizChatScene,
  getChoiceMessageId,
} from "./chatScene";

const QUESTIONS: Question[] = [
  {
    id: "q-01",
    order: 1,
    qtype: "scored",
    category: "排练室",
    prompt: "如果群里突然开始互相阴阳，你先发什么？",
    sceneHint: "排练刚散场，手机还在震。",
    tags: ["test"],
    options: [
      {
        id: "q-01-a",
        text: "先装没看见，等别人把楼盖完。",
        delta: [0, 0, 0],
        tags: ["wait"],
      },
      {
        id: "q-01-b",
        text: "直接把最难听的那句顶回去。",
        delta: [0, 0, 0],
        tags: ["fight"],
      },
      {
        id: "q-01-c",
        text: "先去私聊最容易炸的人。",
        delta: [0, 0, 0],
        tags: ["mediate"],
      },
      {
        id: "q-01-d",
        text: "发一个表情包装作什么都没发生。",
        delta: [0, 0, 0],
        tags: ["deflect"],
      },
    ],
  },
  {
    id: "q-02",
    order: 2,
    qtype: "scored",
    category: "群聊",
    prompt: "第二轮先接哪句话？",
    sceneHint: "楼已经歪到新的方向。",
    tags: ["test"],
    options: [
      {
        id: "q-02-a",
        text: "顺着话题继续拱火。",
        delta: [0, 0, 0],
        tags: ["push"],
      },
      {
        id: "q-02-b",
        text: "发一句很轻的安抚。",
        delta: [0, 0, 0],
        tags: ["soft"],
      },
      {
        id: "q-02-c",
        text: "切到别的话题当没事发生。",
        delta: [0, 0, 0],
        tags: ["switch"],
      },
      {
        id: "q-02-d",
        text: "继续观望不出声。",
        delta: [0, 0, 0],
        tags: ["wait"],
      },
    ],
  },
];

function createAnswer(question: Question, optionId: string): QuizAnswerRecord {
  const option = question.options.find((item) => item.id === optionId);

  if (!option) {
    throw new Error(`Missing option ${optionId}`);
  }

  return {
    questionId: question.id,
    questionType: question.qtype,
    optionId: option.id,
    delta: option.delta,
    latentDelta: option.latentDelta,
    tags: option.tags,
  };
}

describe("createQuizChatScene", () => {
  it("renders answered history as sent bubbles and keeps the current question as choices", () => {
    const scene = createQuizChatScene({
      answers: [createAnswer(QUESTIONS[0], "q-01-b"), null],
      currentQuestionIndex: 1,
      pendingSelection: null,
      questions: QUESTIONS,
      submitMessage: null,
    });

    expect(
      scene.messages.some((message) => message.id === "q-01::answer::q-01-b" && message.status === "seen"),
    ).toBe(true);
    expect(
      scene.messages.filter((message) => message.id.startsWith("q-02::choice::")).length,
    ).toBe(4);
    expect(scene.revisionEntries).toEqual([
      expect.objectContaining({
        answerText: "直接把最难听的那句顶回去。",
        questionIndex: 0,
      }),
    ]);
  });

  it("shows a revision hint when revisiting a question with an existing answer", () => {
    const scene = createQuizChatScene({
      answers: [createAnswer(QUESTIONS[0], "q-01-c"), null],
      currentQuestionIndex: 0,
      pendingSelection: null,
      questions: QUESTIONS,
      submitMessage: null,
    });

    expect(
      scene.messages.some((message) => message.id === "q-01::revision-tip"),
    ).toBe(true);
    expect(scene.revisionEntries[0]).toEqual(
      expect.objectContaining({
        isCurrent: true,
        questionIndex: 0,
      }),
    );
  });

  it("keeps the current question in selectable state during send animation", () => {
    const pendingSelection = { optionId: "q-01-b", questionIndex: 0 } as const;
    const scene = createQuizChatScene({
      answers: [createAnswer(QUESTIONS[0], "q-01-b"), null],
      currentQuestionIndex: 0,
      pendingSelection,
      questions: QUESTIONS,
      submitMessage: "还有 1 题没选。",
    });

    expect(
      scene.messages.some((message) => message.id === getChoiceMessageId(QUESTIONS[0], { id: "q-01-b" })),
    ).toBe(true);
    expect(
      scene.messages.some((message) => message.id === "q-01::answer::q-01-b"),
    ).toBe(false);
    expect(
      scene.messages.some((message) => message.text === "还有 1 题没选。"),
    ).toBe(true);
  });
});
