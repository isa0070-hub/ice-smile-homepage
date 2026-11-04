import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isRepairCasePageOutOfRangeError } from "../src/lib/repairCasePagination.js";

test("PostgREST range overflow becomes a missing repair-case page", () => {
  assert.equal(
    isRepairCasePageOutOfRangeError(
      {
        code: "PGRST103",
        message: "Requested range not satisfiable",
      },
      11,
    ),
    true,
  );
});

test("the first archive page and unrelated database errors remain distinct", () => {
  assert.equal(
    isRepairCasePageOutOfRangeError({ code: "PGRST103" }, 1),
    false,
  );
  assert.equal(
    isRepairCasePageOutOfRangeError({ code: "PGRST301" }, 11),
    false,
  );
  assert.equal(isRepairCasePageOutOfRangeError(null, 11), false);
});

test("repair-case archive handles range overflow before generic query errors", () => {
  const source = readFileSync(
    new URL("../src/app/repair-cases/page.js", import.meta.url),
    "utf8",
  );
  const rangeHandlerIndex = source.indexOf(
    "isRepairCasePageOutOfRangeError(error, currentPage)",
  );
  const genericErrorIndex = source.indexOf(
    'console.error("repair_cases archive error:", error)',
  );

  assert.ok(rangeHandlerIndex >= 0);
  assert.ok(genericErrorIndex > rangeHandlerIndex);
});
