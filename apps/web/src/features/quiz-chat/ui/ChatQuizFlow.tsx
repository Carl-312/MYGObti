import type {
  Question,
  QuestionOption,
  QuizAnswerRecord,
} from "@mygobti/quiz-core";
import { startTransition, useEffect, useRef, useState } from "react";
import { DialogueList } from "../../../shared/ui/dialogue";
import {
  createQuizChatScene,
  getChoiceMessageId,
  type PendingChatSelection,
} from "../model/chatScene";
import "./chat-quiz.css";

const AUTO_ADVANCE_DELAY_MS = 420;

interface ChatQuizFlowProps {
  answers: Array<QuizAnswerRecord | null>;
  currentQuestionIndex: number;
  onJumpToQuestion: (questionIndex: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSelectOption: (question: Question, option: QuestionOption) => void;
  onSubmit: () => void;
  questions: Question[];
  submitMessage: string | null;
}

export function ChatQuizFlow({
  answers,
  currentQuestionIndex,
  onJumpToQuestion,
  onNext,
  onPrevious,
  onSelectOption,
  onSubmit,
  questions,
  submitMessage,
}: ChatQuizFlowProps) {
  const [pendingSelection, setPendingSelection] =
    useState<PendingChatSelection | null>(null);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];
  const lastQuestionIndex = questions.length - 1;
  const scene = createQuizChatScene({
    answers,
    currentQuestionIndex,
    pendingSelection,
    questions,
    submitMessage,
  });
  const latestProgressIndex =
    scene.firstUnansweredIndex === -1
      ? lastQuestionIndex
      : scene.firstUnansweredIndex;
  const selectedChoiceMessageId =
    pendingSelection?.questionIndex === currentQuestionIndex
      ? getChoiceMessageId(currentQuestion, { id: pendingSelection.optionId })
      : undefined;
  const completionPercent =
    questions.length > 0 ? Math.round((scene.answeredCount / questions.length) * 100) : 0;
  const currentQuestionNumber = String(currentQuestion.order).padStart(2, "0");
  const hasResumeTarget = latestProgressIndex !== currentQuestionIndex;
  const primaryAction =
    currentAnswer && hasResumeTarget
      ? {
          label: `回到 Q${String(latestProgressIndex + 1).padStart(2, "0")} 继续测试`,
          onClick: () => onJumpToQuestion(latestProgressIndex),
        }
      : currentAnswer && currentQuestionIndex === lastQuestionIndex
        ? {
            label: "查看人格档案",
            onClick: onSubmit,
          }
        : currentAnswer
          ? {
              label: "继续下一题",
              onClick: onNext,
            }
          : null;

  function clearAutoAdvanceTimer() {
    if (autoAdvanceTimerRef.current !== null) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }

  function queueAdvance(action: () => void) {
    clearAutoAdvanceTimer();
    autoAdvanceTimerRef.current = window.setTimeout(() => {
      autoAdvanceTimerRef.current = null;
      startTransition(action);
    }, AUTO_ADVANCE_DELAY_MS);
  }

  function handleSelect(option: QuestionOption) {
    if (pendingSelection) {
      return;
    }

    const questionIndex = currentQuestionIndex;
    const isLastQuestion = questionIndex === lastQuestionIndex;

    setPendingSelection({
      optionId: option.id,
      questionIndex,
    });
    onSelectOption(currentQuestion, option);

    if (!isLastQuestion) {
      queueAdvance(() => onNext());
      return;
    }

    queueAdvance(() => setPendingSelection(null));
  }

  useEffect(() => {
    clearAutoAdvanceTimer();
    setPendingSelection(null);
  }, [currentQuestionIndex]);

  useEffect(() => clearAutoAdvanceTimer, []);

  return (
    <div className="chat-quiz">
      <div className="chat-quiz__panel">
        <div className="chat-quiz__compact-header">
          <div className="chat-quiz__compact-meta">
            <span className="chat-quiz__eyebrow">{`Q${currentQuestionNumber} / ${questions.length}`}</span>
            <span className="chat-quiz__compact-pct">{`${completionPercent}%`}</span>
          </div>
          <div
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={completionPercent}
            className="chat-quiz__progress-track"
            role="progressbar"
          >
            <div
              className="chat-quiz__progress-fill"
              style={{ width: `${Math.max(completionPercent, 4)}%` }}
            />
          </div>
        </div>

        <DialogueList
          className="chat-quiz__log"
          messages={scene.messages}
          onSelect={(messageId) => {
            const option = currentQuestion.options.find(
              (candidate) => getChoiceMessageId(currentQuestion, candidate) === messageId,
            );

            if (option) {
              handleSelect(option);
            }
          }}
          selectedId={selectedChoiceMessageId}
        />

        <div className="chat-quiz__footer">
          <p className="chat-quiz__hint">
            {currentAnswer
              ? "想改就重选一条消息，新的回复会接上当前时间线。"
              : "先选一条最像你的回答。消息发出后会自动衔接进度，不需要额外确认。"}
          </p>
          <div className="chat-quiz__footer-nav">
            <button
              className="ghost-button"
              disabled={currentQuestionIndex === 0 || pendingSelection !== null}
              onClick={() => startTransition(onPrevious)}
              type="button"
            >
              回上一题
            </button>
            {hasResumeTarget ? (
              <button
                className="ghost-button"
                disabled={pendingSelection !== null}
                onClick={() => startTransition(() => onJumpToQuestion(latestProgressIndex))}
                type="button"
              >
                回到最新进度
              </button>
            ) : null}
            {primaryAction ? (
              <button
                className="primary-button"
                disabled={pendingSelection !== null}
                onClick={() => startTransition(primaryAction.onClick)}
                type="button"
              >
                {primaryAction.label}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
