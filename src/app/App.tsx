import { useState } from "react";
import { characters } from "../entities/character/model/characters";
import { questions } from "../entities/question/model/questions";
import { evaluateQuizResult } from "../features/quiz-engine/model/match";
import { HomePage } from "../pages/home/HomePage";
import type {
  MatchComputation,
  Question,
  QuestionOption,
  QuizAnswerRecord,
} from "../shared/types/quiz";

type QuizStage = "idle" | "answering" | "completed";

function createEmptyAnswers(): Array<QuizAnswerRecord | null> {
  return questions.map(() => null);
}

function createAnswerRecord(
  question: Question,
  option: QuestionOption,
): QuizAnswerRecord {
  return {
    questionId: question.id,
    optionId: option.id,
    delta: option.delta,
    tags: option.tags,
  };
}

export function App() {
  const [stage, setStage] = useState<QuizStage>("idle");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<QuizAnswerRecord | null>>(
    createEmptyAnswers,
  );
  const [result, setResult] = useState<MatchComputation | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  function resetQuiz(nextStage: QuizStage) {
    setStage(nextStage);
    setCurrentQuestionIndex(0);
    setAnswers(createEmptyAnswers());
    setResult(null);
    setSubmitMessage(null);
  }

  function handleStart() {
    resetQuiz("answering");
  }

  function handleRestart() {
    resetQuiz("idle");
  }

  function handleSelectOption(question: Question, option: QuestionOption) {
    setAnswers((currentAnswers) => {
      const nextAnswers = [...currentAnswers];
      nextAnswers[currentQuestionIndex] = createAnswerRecord(question, option);
      return nextAnswers;
    });
    setSubmitMessage(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }

  function handlePrevious() {
    setSubmitMessage(null);
    setCurrentQuestionIndex((currentIndex) => Math.max(0, currentIndex - 1));
  }

  function handleNext() {
    setSubmitMessage(null);
    setCurrentQuestionIndex((currentIndex) =>
      Math.min(questions.length - 1, currentIndex + 1),
    );
  }

  function handleSubmit() {
    const unansweredIndex = answers.findIndex((answer) => answer === null);

    if (unansweredIndex !== -1) {
      const remainingCount = answers.filter((answer) => answer === null).length;

      setCurrentQuestionIndex(unansweredIndex);
      setSubmitMessage(
        `还有 ${remainingCount} 题没选，先把空白补完再看结果。`,
      );
      return;
    }

    const completedAnswers = answers.filter(
      (answer): answer is QuizAnswerRecord => answer !== null,
    );

    setResult(
      evaluateQuizResult({
        profiles: characters,
        answers: completedAnswers,
      }),
    );
    setSubmitMessage(null);
    setStage("completed");
  }

  return (
    <HomePage
      stage={stage}
      questions={questions}
      currentQuestionIndex={currentQuestionIndex}
      answers={answers}
      result={result}
      submitMessage={submitMessage}
      onStart={handleStart}
      onRestart={handleRestart}
      onSelectOption={handleSelectOption}
      onPrevious={handlePrevious}
      onNext={handleNext}
      onSubmit={handleSubmit}
    />
  );
}
