import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderBandStoryPage } from "../test/renderBandStoryPage";

describe("BandStoryPage", () => {
  it("renders a requested chapter from the chapter query", async () => {
    renderBandStoryPage("/band-story?chapter=chapter-02");

    expect(await screen.findByRole("heading", { name: "Chapter 02" })).toBeInTheDocument();
    expect(screen.getByText(/仅保留章节元信息/)).toBeInTheDocument();
    expect(screen.getByTestId("location-search")).toHaveTextContent("?chapter=chapter-02");
  });

  it("updates the chapter query when selecting another chapter", async () => {
    renderBandStoryPage("/band-story?chapter=chapter-01");

    fireEvent.click(screen.getByRole("button", { name: /Chapter 02/i }));

    expect(await screen.findByRole("heading", { name: "Chapter 02" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("location-search")).toHaveTextContent("?chapter=chapter-02");
    });
  });

  it("falls back to the default chapter when the query is invalid", async () => {
    renderBandStoryPage("/band-story?chapter=missing-chapter");

    expect(
      await screen.findByRole("heading", { name: /Returns - Cold Rain/i }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("location-search")).toHaveTextContent("?chapter=chapter-01");
    });
  });

  it("filters the chapter list and keeps the selected chapter stable", async () => {
    renderBandStoryPage("/band-story?chapter=chapter-01");

    fireEvent.change(screen.getByLabelText("搜索章节"), {
      target: { value: "chapter 02" },
    });

    expect(screen.queryByRole("button", { name: /Returns - Cold Rain/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Chapter 02/i })).toBeInTheDocument();
    expect(screen.getByText(/当前仍显示/)).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: /Returns - Cold Rain/i }),
    ).toBeInTheDocument();
  });
});
