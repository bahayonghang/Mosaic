import { fireEvent, render, screen } from "@testing-library/react";
import * as exportActions from "@/features/export/exportActions";
import * as importActions from "@/features/import/importActions";
import { DEFAULT_EXPORT_SUFFIX } from "@/lib/exportName";
import { useDocStore } from "@/store/docStore";
import { useEditorStore } from "@/store/editorStore";
import { useSettingsStore } from "@/store/settingsStore";
import App from "./App";

function workspace() {
  return screen.getByRole("button", { name: "设置" }).closest("div.flex.h-full")!;
}

function openMenu() {
  fireEvent.pointerDown(screen.getByRole("button", { name: "设置" }), {
    button: 0,
    ctrlKey: false,
  });
}

function openSettings() {
  openMenu();
  fireEvent.click(screen.getByRole("menuitem", { name: "设置…" }));
}

describe("App shell", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({ exportSuffix: DEFAULT_EXPORT_SUFFIX });
    useDocStore.setState({ docs: [], currentId: null });
    useEditorStore.setState({ tool: "rect" });
  });

  it("shows the empty state when no document is open", () => {
    render(<App />);
    expect(screen.getByText("拖入图片、PDF 或文件夹")).toBeInTheDocument();
    expect(screen.getByText("未打开文件")).toBeInTheDocument();
  });

  it("opens a full-window settings page that makes the workspace inert", () => {
    render(<App />);
    const shell = workspace();
    expect(shell).not.toHaveAttribute("inert");

    openSettings();

    const page = document.querySelector("[data-settings-page]");
    expect(page).toBeInTheDocument();
    expect(page).not.toHaveAttribute("role", "dialog");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "设置" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "关闭" })).toBeInTheDocument();
    expect(shell).toHaveAttribute("inert");
    expect(shell.contains(page)).toBe(false);
    expect(screen.getByText("未打开文件")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    expect(document.querySelector("[data-settings-page]")).not.toBeInTheDocument();
    expect(shell).not.toHaveAttribute("inert");
    expect(shell).toBeInTheDocument();
  });

  it("ignores editor and open shortcuts while the settings page is open", () => {
    const exportCurrent = vi.spyOn(exportActions, "exportCurrent").mockResolvedValue(undefined);
    const openFilesDialog = vi.spyOn(importActions, "openFilesDialog").mockResolvedValue(undefined);
    useEditorStore.setState({ tool: "brush" });
    render(<App />);
    openSettings();

    fireEvent.keyDown(window, { key: "s", ctrlKey: true });
    fireEvent.keyDown(window, { key: "r" });
    fireEvent.keyDown(window, { key: "o", ctrlKey: true });
    expect(exportCurrent).not.toHaveBeenCalled();
    expect(openFilesDialog).not.toHaveBeenCalled();
    expect(useEditorStore.getState().tool).toBe("brush");

    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    fireEvent.keyDown(window, { key: "r" });
    fireEvent.keyDown(window, { key: "s", ctrlKey: true });
    fireEvent.keyDown(window, { key: "o", ctrlKey: true });
    expect(useEditorStore.getState().tool).toBe("rect");
    expect(exportCurrent).toHaveBeenCalledOnce();
    expect(openFilesDialog).toHaveBeenCalledOnce();
    vi.restoreAllMocks();
  });

  it("still opens the about dialog after the settings page closes", () => {
    render(<App />);
    openSettings();
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));

    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "关于 Mosaic" }));
    expect(screen.getByRole("heading", { name: "关于 Mosaic" })).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
