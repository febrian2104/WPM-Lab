import { describe, expect, it } from "vitest";
import { buildStableWordQueue } from "./word-generator";

describe("buildStableWordQueue", () => {
  const words = ["aku", "kamu", "dia", "mereka", "belajar"];

  it("menghasilkan urutan yang sama untuk seed yang sama", () => {
    const firstQueue = buildStableWordQueue(words, 12, "id");
    const secondQueue = buildStableWordQueue(words, 12, "id");

    expect(secondQueue).toEqual(firstQueue);
  });

  it("menghasilkan jumlah kata sesuai ukuran yang diminta", () => {
    const queue = buildStableWordQueue(words, 20, "en");

    expect(queue).toHaveLength(20);
    expect(queue.every((word) => words.includes(word))).toBe(true);
  });
});
