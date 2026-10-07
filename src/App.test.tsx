import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App shell", () => {
  it("shows the empty state when no document is open", () => {
    render(<App />);
    expect(screen.getByText("拖入图片、PDF 或文件夹")).toBeInTheDocument();
    expect(screen.getByText("未打开文件")).toBeInTheDocument();
  });
});
