import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type {
  CharacterProfile,
  Question,
  QuizContentSnapshot,
  QuizMeta,
  QuizMetaResponse,
} from "@mygobti/quiz-core";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { RuntimeQuizContent } from "../entities/quiz/model/runtimeQuiz";
import { App } from "./App";

const runtimeContent = createRuntimeContent();

vi.mock("../entities/quiz/model/useRuntimeQuizContent", () => ({
  useRuntimeQuizContent: () => ({
    runtimeContent,
    meta: runtimeContent.meta,
    loadState: "ready",
    loadMessage: "ready",
    loadError: null,
    reload: vi.fn(),
  }),
}));

function LocationProbe() {
  const location = useLocation();

  return <div data-testid="location-path">{location.pathname}</div>;
}

describe("App quiz routes", () => {
  it("keeps the home page as an entry surface and opens quiz flow on /test", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /测出你最像哪位 MyGO 角色/ })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /quiz flow/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /开始测试/ }));

    await waitFor(() => {
      expect(screen.getByTestId("location-path")).toHaveTextContent("/test");
    });
    expect(screen.getByRole("region", { name: /quiz flow/ })).toBeInTheDocument();
  });

  it("redirects the old start query to the standalone test route", async () => {
    render(
      <MemoryRouter initialEntries={["/?start=1"]}>
        <App />
        <LocationProbe />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("location-path")).toHaveTextContent("/test");
    });
  });

  it("does not scroll the document again when selecting an answer", async () => {
    const scrollIntoViewMock = vi.mocked(Element.prototype.scrollIntoView);

    render(
      <MemoryRouter initialEntries={["/test"]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: /先观察大家/ })).toBeInTheDocument();
    scrollIntoViewMock.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /先观察大家/ }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /查看人格档案/ })).toBeInTheDocument();
    });
    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });
});

function createRuntimeContent(): RuntimeQuizContent {
  const tieBreakerRule: QuizMeta["tieBreakerRule"] = {
    enabledWhenTop2DiffBelow: 0.1,
    onlyWhenTop2IncludesAnyOf: ["灯"],
    primaryTrait: "latent",
    lambda: {
      default: 0.35,
      priorityPair: 0.5,
    },
    priorityPairs: [["灯", "爱音"]],
  };
  const quizMeta: QuizMeta = {
    note: "test content",
    tieBreakerRule,
  };
  const questions: Question[] = [
    {
      id: "q1",
      order: 1,
      qtype: "scored",
      category: "入门",
      prompt: "排练前你会怎么做？",
      sceneHint: "测试场景",
      tags: ["test"],
      options: [
        createOption("a", "先观察大家"),
        createOption("b", "直接开口推进"),
        createOption("c", "把话放在心里"),
        createOption("d", "先整理计划"),
      ],
    },
  ];
  const characters: CharacterProfile[] = [
    createProfile("tomori", "灯", false),
    createProfile("anon", "爱音", false),
  ];
  const meta: QuizMetaResponse = {
    version: "test-v1",
    sourcePath: "test",
    note: quizMeta.note,
    tieBreakerRule,
    counts: {
      questions: questions.length,
      characters: characters.length,
      publicCharacters: characters.length,
      hiddenCharacters: 0,
    },
  };
  const content: QuizContentSnapshot = {
    version: meta.version,
    sourcePath: meta.sourcePath,
    meta: {},
    quizMeta,
    questions,
    characters: [],
    counts: meta.counts,
  };

  return {
    meta,
    content,
    quizMeta,
    questions,
    characters,
    publicCharacters: characters,
  };
}

function createOption(id: string, text: string) {
  return {
    id,
    text,
    delta: [0, 0, 0] as [number, number, number],
    tags: [id],
  };
}

function createProfile(
  id: string,
  name: string,
  hidden: boolean,
): CharacterProfile {
  return {
    id,
    name,
    hidden,
    anchor: [0, 0, 0],
    latentAnchor: 0,
    relationships: {
      rivalId: id,
      soulmateId: id,
    },
    result: {
      description: `${name} description`,
      shortReview: `${name} review`,
      quote: `${name} quote`,
      posterCaption: `${name} poster`,
      highlights: [`${name} highlight`],
    },
    summary: `${name} summary`,
    tags: [name],
    title: `${name} title`,
  };
}
