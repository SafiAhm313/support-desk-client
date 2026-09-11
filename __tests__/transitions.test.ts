import { legalTransitions, transitionRequiresNote } from "@/lib/transitions";

describe("legalTransitions", () => {
  it("offers exactly [in_progress] from open, and no others", () => {
    const moves = legalTransitions("open");
    expect(moves).toEqual(["in_progress"]);
    expect(moves).not.toContain("resolved");
    expect(moves).not.toContain("closed");
    expect(moves).not.toContain("open");
  });

  it("offers exactly [resolved] from in_progress, and no others", () => {
    const moves = legalTransitions("in_progress");
    expect(moves).toEqual(["resolved"]);
    expect(moves).not.toContain("open");
    expect(moves).not.toContain("closed");
    expect(moves).not.toContain("in_progress");
  });

  it("offers exactly [closed, in_progress] from resolved, and no others", () => {
    const moves = legalTransitions("resolved");
    expect(moves).toEqual(["closed", "in_progress"]);
    expect(moves).not.toContain("open");
    expect(moves).not.toContain("resolved");
  });

  it("offers exactly [in_progress] from closed, and no others", () => {
    const moves = legalTransitions("closed");
    expect(moves).toEqual(["in_progress"]);
    expect(moves).not.toContain("open");
    expect(moves).not.toContain("resolved");
    expect(moves).not.toContain("closed");
  });
});

describe("transitionRequiresNote", () => {
  it("requires a note only for closed -> in_progress", () => {
    expect(transitionRequiresNote("closed", "in_progress")).toBe(true);
  });

  it("does not require a note for any other transition", () => {
    expect(transitionRequiresNote("open", "in_progress")).toBe(false);
    expect(transitionRequiresNote("in_progress", "resolved")).toBe(false);
    expect(transitionRequiresNote("resolved", "closed")).toBe(false);
    expect(transitionRequiresNote("resolved", "in_progress")).toBe(false);
  });
});
