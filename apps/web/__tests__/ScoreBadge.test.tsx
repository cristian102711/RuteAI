import React from "react";
import { render, screen } from "@testing-library/react";
import { ScoreBadge } from "../app/dashboard/components/ScoreBadge";

describe("ScoreBadge", () => {
  it("renders score as percentage string", () => {
    render(<ScoreBadge score={75} />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("renders score 0 with leading zero padding", () => {
    render(<ScoreBadge score={0} />);
    expect(screen.getByText("00%")).toBeInTheDocument();
  });

  it("renders score 5 padded to 2 digits", () => {
    render(<ScoreBadge score={5} />);
    expect(screen.getByText("05%")).toBeInTheDocument();
  });

  it("renders score 100 correctly", () => {
    render(<ScoreBadge score={100} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("applies green tone for score < 40 (low risk)", () => {
    const { container } = render(<ScoreBadge score={30} />);
    expect(container.firstChild).toHaveClass("bg-emerald-500/15");
  });

  it("applies yellow tone for score 40-69 (medium risk)", () => {
    const { container } = render(<ScoreBadge score={55} />);
    expect(container.firstChild).toHaveClass("bg-yellow-500/15");
  });

  it("applies red tone for score >= 70 (high risk)", () => {
    const { container } = render(<ScoreBadge score={85} />);
    expect(container.firstChild).toHaveClass("bg-red-500/15");
  });

  it("applies boundary score 40 as yellow", () => {
    const { container } = render(<ScoreBadge score={40} />);
    expect(container.firstChild).toHaveClass("bg-yellow-500/15");
  });

  it("applies boundary score 70 as red", () => {
    const { container } = render(<ScoreBadge score={70} />);
    expect(container.firstChild).toHaveClass("bg-red-500/15");
  });

  it("renders as a span element", () => {
    const { container } = render(<ScoreBadge score={50} />);
    expect(container.firstChild?.nodeName).toBe("SPAN");
  });

  it("applies extra className when provided", () => {
    const { container } = render(<ScoreBadge score={50} className="mi-clase" />);
    expect(container.firstChild).toHaveClass("mi-clase");
  });
});
