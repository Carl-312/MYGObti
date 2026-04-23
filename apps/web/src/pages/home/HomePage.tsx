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
    "按第一反应作答，系统会持续累计角色匹配和三轴判断",
    "完成后立即查看结果，并把海报保存或分享出去",
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
