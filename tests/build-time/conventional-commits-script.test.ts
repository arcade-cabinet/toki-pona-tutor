import { describe, expect, it } from "vitest";

const conventional = (await import("../../scripts/check-conventional-commits.mjs")) as {
    conventionalHeaderError(message: unknown): string | null;
    conventionalHeaderFailures(messages: string[]): Array<{ message: string; error: string }>;
};

describe("conventional commit checker", () => {
    it("accepts release-please friendly Conventional Commit headers", () => {
        expect(conventional.conventionalHeaderError("feat: add Rivers Reckoning title")).toBeNull();
        expect(
            conventional.conventionalHeaderError("fix(ui): keep mobile buttons tappable"),
        ).toBeNull();
        expect(conventional.conventionalHeaderError("feat!: replace legacy title flow")).toBeNull();
    });

    it("rejects non-conventional titles before release-please can miss them", () => {
        expect(conventional.conventionalHeaderError("Update stuff")).toContain(
            "expected Conventional Commit header",
        );
        expect(
            conventional
                .conventionalHeaderFailures(["docs: update release flow", "oops"])
                .map((failure) => failure.message),
        ).toEqual(["oops"]);
    });
});
