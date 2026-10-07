import { fireEvent, render, screen } from "@testing-library/react";
import { DEFAULT_EXPORT_SUFFIX } from "@/lib/exportName";
import { useSettingsStore } from "@/store/settingsStore";
import { SettingsPage } from "./SettingsPage";

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState({ exportSuffix: DEFAULT_EXPORT_SUFFIX });
});

function page() {
  return document.querySelector("[data-settings-page]");
}

describe("SettingsPage", () => {
  it("is a page titled 设置 with 关闭, and not a dialog", () => {
    render(<SettingsPage onClose={() => {}} />);
    expect(screen.getByRole("heading", { name: "设置" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "关闭" })).toBeInTheDocument();
    expect(screen.getByText("导出时，新文件名在原文件名后加上后缀。")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "取消" })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(page()).not.toHaveAttribute("role", "dialog");
    expect(page()?.getAttribute("role")).toBeNull();
  });

  it("discards the draft on 关闭 and on Escape", () => {
    useSettingsStore.getState().setExportSuffix("-kept");
    const onClose = vi.fn();
    const { unmount } = render(<SettingsPage onClose={onClose} />);
    const input = screen.getByLabelText("导出文件名后缀");
    expect(input).toHaveValue("-kept");

    fireEvent.change(input, { target: { value: "draft" } });
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(useSettingsStore.getState().exportSuffix).toBe("-kept");

    unmount();
    render(<SettingsPage onClose={vi.fn()} />);
    expect(screen.getByLabelText("导出文件名后缀")).toHaveValue("-kept");

    fireEvent.change(screen.getByLabelText("导出文件名后缀"), { target: { value: "other" } });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(useSettingsStore.getState().exportSuffix).toBe("-kept");
  });

  it("saves a trimmed suffix and closes on 保存 and Enter", () => {
    const onClose = vi.fn();
    render(<SettingsPage onClose={onClose} />);
    const input = screen.getByLabelText("导出文件名后缀");

    fireEvent.change(input, { target: { value: "  -masked " } });
    expect(screen.getByText("示例：证书.jpg → 证书-masked.jpg")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(useSettingsStore.getState().exportSuffix).toBe("-masked");
    expect(onClose).toHaveBeenCalledOnce();

    onClose.mockClear();
    useSettingsStore.setState({ exportSuffix: DEFAULT_EXPORT_SUFFIX });
    fireEvent.change(screen.getByLabelText("导出文件名后缀"), { target: { value: "  -ok " } });
    fireEvent.submit(screen.getByLabelText("导出文件名后缀").closest("form")!);
    expect(useSettingsStore.getState().exportSuffix).toBe("-ok");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("blocks an invalid suffix: shows the reason, disables 保存, and ignores Enter", () => {
    const onClose = vi.fn();
    render(<SettingsPage onClose={onClose} />);
    const input = screen.getByLabelText("导出文件名后缀");
    fireEvent.change(input, { target: { value: "a:b" } });

    expect(screen.getByText('后缀不能包含 \\ / : * ? " < > |')).toBeInTheDocument();
    expect(screen.queryByText(/示例：/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();

    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.submit(input.closest("form")!);
    expect(onClose).not.toHaveBeenCalled();
    expect(useSettingsStore.getState().exportSuffix).toBe(DEFAULT_EXPORT_SUFFIX);
    expect(page()).toBeInTheDocument();
  });

  it("restores the default draft without writing or leaving", () => {
    useSettingsStore.getState().setExportSuffix("-kept");
    const onClose = vi.fn();
    render(<SettingsPage onClose={onClose} />);
    fireEvent.change(screen.getByLabelText("导出文件名后缀"), { target: { value: "custom" } });
    fireEvent.click(screen.getByRole("button", { name: "恢复默认" }));

    expect(screen.getByLabelText("导出文件名后缀")).toHaveValue(DEFAULT_EXPORT_SUFFIX);
    expect(screen.getByText("示例：证书.jpg → 证书_打码版.jpg")).toBeInTheDocument();
    expect(useSettingsStore.getState().exportSuffix).toBe("-kept");
    expect(onClose).not.toHaveBeenCalled();
    expect(page()).toBeInTheDocument();
  });
});
