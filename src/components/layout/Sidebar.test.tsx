import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { docIdOf, useDocStore } from "@/store/docStore";
import type { MosaicDoc } from "@/store/types";
import { Sidebar } from "./Sidebar";

const R = "D:\\证书";

function doc(path: string, root?: string, dirs?: string[]): MosaicDoc {
  return {
    id: docIdOf(path),
    path,
    name: path.split(/[\\/]/).pop()!,
    kind: "image",
    ...(root !== undefined && { root, dirs: dirs ?? [] }),
    status: "ready",
    pages: [{ width: 10, height: 10, ops: [], redo: [] }],
    currentPage: 0,
    version: 0,
  };
}

const nested = doc(`${R}\\2024\\省赛\\c.pdf`, R, ["2024", "省赛"]);

function show(docs: MosaicDoc[]) {
  useDocStore.setState({ docs, currentId: docs[0]?.id ?? null });
  render(
    <TooltipProvider>
      <Sidebar />
    </TooltipProvider>,
  );
}

afterEach(() => {
  useDocStore.setState({ docs: [], currentId: null });
});

describe("Sidebar folder actions", () => {
  it("disables both actions when there is no folder", () => {
    show([doc("E:\\x.png")]);
    expect(screen.getByRole("button", { name: "展开所有文件夹" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "收缩所有文件夹" })).toBeDisabled();
  });

  it("collapses every folder, then expands them again", () => {
    show([
      doc(`${R}\\a.jpg`, R, []),
      doc(`${R}\\2024\\b.png`, R, ["2024"]),
      nested,
      doc("E:\\x.png"),
    ]);
    expect(screen.getByRole("button", { name: "展开所有文件夹" })).toBeDisabled();
    expect(screen.getByText("b.png")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "收缩所有文件夹" }));
    expect(screen.getByRole("button", { name: /^证书/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText("a.jpg")).not.toBeInTheDocument();
    expect(screen.queryByText("b.png")).not.toBeInTheDocument();
    expect(screen.queryByText("c.pdf")).not.toBeInTheDocument();
    expect(screen.queryByText("省赛")).not.toBeInTheDocument();
    expect(screen.getByText("x.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "收缩所有文件夹" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "展开所有文件夹" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "展开所有文件夹" }));
    expect(screen.getByRole("button", { name: /^证书/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("button", { name: /^2024/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("button", { name: /^省赛/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("c.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "展开所有文件夹" })).toBeDisabled();
  });

  it("opens the ancestors of a newly selected file after collapse all", () => {
    show([nested]);
    fireEvent.click(screen.getByRole("button", { name: "收缩所有文件夹" }));
    expect(screen.queryByText("c.pdf")).not.toBeInTheDocument();

    act(() => useDocStore.getState().select(nested.id));
    expect(screen.queryByText("c.pdf")).not.toBeInTheDocument();

    const other = doc(`${R}\\2024\\b.png`, R, ["2024"]);
    act(() => {
      useDocStore.setState({ docs: [nested, other], currentId: other.id });
    });
    expect(screen.getByText("b.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^省赛/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText("c.pdf")).not.toBeInTheDocument();
  });
});
