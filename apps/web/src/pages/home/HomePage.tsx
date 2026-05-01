import { type Question } from "@mygobti/quiz-core";
import {
  HomeHeroSection,
} from "./sections/HomePageSections";
import { DISCLAIMER_TEXT } from "./copy";

interface HomePageProps {
  questions: Question[];
  onStart: () => void;
}

export function HomePage({
  questions,
  onStart,
}: HomePageProps) {
  const estimatedMinutes = Math.max(2, Math.ceil(questions.length / 4));
  const stageCopy = [
    `${questions.length} 道情境单选，预计 ${estimatedMinutes} 分钟答完`,
    "按第一反应作答，你的选择会逐步拼出角色共振画像",
    "完成后解锁角色档案，也可以保存成专属海报",
  ] as const;

  return (
    <main className="experience-shell experience-shell--idle">
      <HomeHeroSection
        currentQuestionOrder={1}
        disclaimerText={DISCLAIMER_TEXT}
        estimatedMinutes={estimatedMinutes}
        progressPercent={0}
        questionsCount={questions.length}
        stage="idle"
        stageCopy={stageCopy}
        onContinue={onStart}
        onRestart={onStart}
        onStart={onStart}
        onViewResult={onStart}
      />
    </main>
  );
}
