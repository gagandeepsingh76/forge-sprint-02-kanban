import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

const THEME_STORAGE_KEY = "forge-sprint-theme";

function ThemeHarness() {
  return (
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("hydrates a saved dark theme without mismatch warnings", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    const serverHtml = renderToString(<ThemeHarness />);
    const container = document.createElement("div");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    let root: Root | null = null;

    container.innerHTML = serverHtml;
    document.body.append(container);

    await act(async () => {
      root = hydrateRoot(container, <ThemeHarness />);
    });

    const errorOutput = consoleError.mock.calls.flat().map(String).join("\n");

    expect(errorOutput).not.toMatch(/hydration|did not match/i);
    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
      expect(container.querySelector("button")).toHaveAccessibleName(
        "Switch to light theme",
      );
    });

    await act(async () => {
      root?.unmount();
    });
  });

  it("toggles light and dark themes and persists the selection", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    const user = userEvent.setup();

    render(<ThemeHarness />);

    const switchToLightButton = await screen.findByRole("button", {
      name: /switch to light theme/i,
    });

    expect(document.documentElement).toHaveClass("dark");

    await user.click(switchToLightButton);

    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass("dark");
    });
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");

    await user.click(
      screen.getByRole("button", { name: /switch to dark theme/i }),
    );

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
    });
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });
});
