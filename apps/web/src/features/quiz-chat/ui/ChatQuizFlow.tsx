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
  const remainingCount = Math.max(questions.length - scene.answeredCount, 0);
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
            label: "查看人格结果",
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
      <div className="chat-quiz__main">
        <div className="chat-quiz__panel">
          <header className="chat-quiz__panel-header">
            <div className="chat-quiz__panel-intro">
              <p className="chat-quiz__eyebrow">答题进行中</p>
              <h3>{`人格测试进行中 · 第 ${currentQuestion.order}/${questions.length} 题`}</h3>
              <p className="chat-quiz__lede">
                聊天只是答题载体。你现在发出的每一条回答，都会累计进角色匹配和三轴倾向判断。
              </p>
            </div>
            <div className="chat-quiz__status-grid">
              <div className="chat-quiz__status-card">
                <span>当前题号</span>
                <strong>{`Q${currentQuestionNumber} / ${questions.length}`}</strong>
                <p>{currentQuestion.category}</p>
              </div>
              <div className="chat-quiz__status-card">
                <span>测试进度</span>
                <strong>{`${completionPercent}%`}</strong>
                <p>
                  {scene.answeredCount === questions.length
                    ? "全部题目都已记录。"
                    : `已完成 ${scene.answeredCount} 题，还剩 ${remainingCount} 题。`}
                </p>
              </div>
              <div className="chat-quiz__status-card">
                <span>人格判断</span>
                <strong>角色匹配 + 三轴</strong>
                <p>
                  {currentAnswer
                    ? "当前题答案已写入判断样本，修改后会覆盖旧记录。"
                    : "当前题还没作答，选中的消息会立刻影响最终判断。"}
                </p>
              </div>
            </div>
          </header>

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

          <div className="chat-quiz__control-bar">
            <div className="chat-quiz__action-group">
              <p className="chat-quiz__action-label">题目导航</p>
              <button
                className="ghost-button"
                disabled={currentQuestionIndex === 0 || pendingSelection !== null}
                onClick={() => startTransition(onPrevious)}
                type="button"
              >
                回上一题
              </button>
            </div>

            <div className="chat-quiz__action-group">
              <p className="chat-quiz__action-label">进度控制</p>
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
              {!hasResumeTarget ? (
                <p className="chat-quiz__action-placeholder">
                  正常作答时会自动推进；如果你在旧题停留过，这里会提供回到当前进度的入口。
                </p>
              ) : null}
            </div>

            <div className="chat-quiz__action-group chat-quiz__action-group--primary">
              <p className="chat-quiz__control-note">
                {currentAnswer
                  ? "想改答案时，直接重选一条消息；系统会用新答案覆盖这一题的旧记录。"
                  : "先选一条最像你的回答。消息发出后会自动衔接测试进度，不需要额外确认。"}
              </p>
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

      <aside className="chat-quiz__sidebar">
        <section className="chat-quiz__sidebar-card">
          <p className="chat-quiz__eyebrow">测试控制</p>
          <h3>你现在完成的是一套人格测试</h3>
          <p className="chat-quiz__sidebar-copy">
            聊天形式被保留下来，但系统真正记录的是你的作答进度和每题选择，不是剧情回放。
          </p>
          <div className="chat-quiz__sidebar-metrics">
            <div className="chat-quiz__sidebar-metric">
              <span>当前停在</span>
              <strong>{`Q${currentQuestionNumber}`}</strong>
            </div>
            <div className="chat-quiz__sidebar-metric">
              <span>已记录</span>
              <strong>{`${scene.answeredCount}/${questions.length}`}</strong>
            </div>
            <div className="chat-quiz__sidebar-metric">
              <span>结果状态</span>
              <strong>完成后生成</strong>
            </div>
          </div>
          <ul className="chat-quiz__guidance-list">
            <li>每一题的选择都会参与角色匹配和三轴倾向计算。</li>
            <li>如果回看旧题，优先用“回到最新进度”继续完成整套测试。</li>
            <li>完成最后一题后，页面会把你带到结果区和分享动作。</li>
          </ul>
        </section>

        <section className="chat-quiz__sidebar-card">
          <p className="chat-quiz__eyebrow">答案修订</p>
          <h3>已记录的回答，可随时返回修改</h3>
          <p className="chat-quiz__sidebar-copy">
            这里保留轻量修订入口。点任意一题都会回到对应位置，重新作答后旧答案会被覆盖。
          </p>
          <div className="chat-quiz__revision-list">
            {scene.revisionEntries.length > 0 ? (
              scene.revisionEntries.map((entry) => (
                <button
                  className={`chat-quiz__revision-button${
                    entry.isCurrent ? " chat-quiz__revision-button--active" : ""
                  }`}
                  disabled={pendingSelection !== null}
                  key={`${entry.questionIndex}-${entry.answerText}`}
                  onClick={() => startTransition(() => onJumpToQuestion(entry.questionIndex))}
                  type="button"
                >
                  <span>{`Q${String(entry.questionOrder).padStart(2, "0")}`}</span>
                  <strong>{entry.answerText}</strong>
                  <p>{entry.prompt}</p>
                </button>
              ))
            ) : (
              <div className="chat-quiz__empty-state">
                还没有记录任何答案。先完成第一题，进度记录会从这里开始累积。
              </div>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
