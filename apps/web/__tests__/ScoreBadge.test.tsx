import React from "react";
import { render, screen } from "@testing-library/react";
import { ScoreBadge } from "../app/dashboard/components/ScoreBadge";

describe("ScoreBadge", () => {
  it("renders the score as zero-padded percentage", () => {
    render(<ScoreBadge score={5} />);
    expect(screen.getByText("05%")).toBeInTheDocument();
  });

  it("renders score >= 70 with red tone (alto riesgo)", () => {
    const { container } = render(<ScoreBadge score={75} />);
    const el = container.firstChild as HTMLElement;
    // 75 >= 70 → red
    expect(el.className).toMatch(/red/);
  });

  it("renders score between 40 and 69 with yellow tone (riesgo medio)", () => {
    const { container } = render(<ScoreBadge score={55} />);
    const el = container.firstChild as HTMLElement;
    // 55 >= 40 but < 70 → yellow
    expect(el.className).toMatch(/yellow/);
  });

  it("renders score < 40 with emerald tone (bajo riesgo)", () => {
    const { container } = render(<ScoreBadge score={20} />);
    const el = container.firstChild as HTMLElement;
    // 20 < 40 → emerald
    expect(el.className).toMatch(/emerald/);
  });

  it("score of exactly 70 is red", () => {
    const { container } = render(<ScoreBadge score={70} />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/red/);
  });

  it("score of exactly 40 is yellow", () => {
    const { container } = render(<ScoreBadge score={40} />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/yellow/);
  });

  it("applies extra className when provided", () => {
    const { container } = render(<ScoreBadge score={10} className="extra" />);
    expect(container.firstChild).toHaveClass("extra");
  });
});
