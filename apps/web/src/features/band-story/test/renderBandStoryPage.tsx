import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { BandStoryPage } from "../ui/BandStoryPage";

function LocationProbe() {
  const location = useLocation();

  return <div data-testid="location-search">{location.search}</div>;
}

export function renderBandStoryPage(route = "/band-story") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          element={
            <>
              <BandStoryPage />
              <LocationProbe />
            </>
          }
          path="/band-story"
        />
      </Routes>
    </MemoryRouter>,
  );
}

export function renderWithRouter(element: ReactElement, route = "/band-story") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route element={element} path="/band-story" />
      </Routes>
    </MemoryRouter>,
  );
}
