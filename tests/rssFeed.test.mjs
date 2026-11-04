import test from "node:test";
import assert from "node:assert/strict";
import {
  RSS_MAX_BYTES,
  cleanRssText,
  escapeRssXml,
  getLatestRepairCaseRssDate,
  getRepairCaseContentSectionTexts,
  getUtf8ByteLength,
  joinRssItemsWithinBudget,
  makeRepairCaseRssDescription,
} from "../src/lib/rssFeed.js";

test("RSS repair-case description includes the complete repair body", () => {
  const body = "파손된 액정을 분리한 뒤 새 액정으로 교체하고 터치와 화면 출력을 점검했습니다.";
  const description = makeRepairCaseRssDescription({
    title: "아이폰15프로 액정 수리",
    branch: "선릉점",
    device: "아이폰",
    model: "아이폰15프로",
    symptom: "화면 파손",
    repair_content: body,
    content_sections: [
      { title: "액정 분리", content: "파손 부품을 안전하게 분리했습니다." },
      { title: "수리 완료", content: "최종 기능 검사를 완료했습니다." },
    ],
  });

  assert.match(description, /^선릉점 · 아이폰 · 아이폰15프로 수리사례입니다\./);
  assert.match(description, /접수 증상: 화면 파손\./);
  assert.ok(description.includes(body));
  assert.match(description, /액정 분리 파손 부품을 안전하게 분리했습니다\./);
  assert.match(description, /수리 완료 최종 기능 검사를 완료했습니다\./);
  assert.ok(description.endsWith("최종 기능 검사를 완료했습니다."));
  assert.equal(description.includes("…"), false);
});

test("RSS section parser supports legacy wrapped and encoded content", () => {
  const encoded = JSON.stringify({
    content_sections: [
      { title: "점검", content: "메인보드를 점검했습니다." },
    ],
  });

  assert.deepEqual(getRepairCaseContentSectionTexts(encoded), [
    "점검",
    "메인보드를 점검했습니다.",
  ]);
});

test("RSS text removes invalid XML controls and escapes administrator text", () => {
  const cleaned = cleanRssText("점검\u0000 완료\n 액정 <교체>");

  assert.equal(cleaned, "점검 완료 액정 <교체>");
  assert.equal(
    escapeRssXml(cleaned),
    "점검 완료 액정 &lt;교체&gt;",
  );
});

test("RSS budget keeps complete newest items and stays below the feed limit", () => {
  const renderedItems = ["가".repeat(10), "나".repeat(10), "다".repeat(10)];
  const firstTwoBytes = getUtf8ByteLength(renderedItems[0] + renderedItems[1]);
  const joined = joinRssItemsWithinBudget(renderedItems, firstTwoBytes);

  assert.equal(joined, renderedItems[0] + renderedItems[1]);
  assert.ok(getUtf8ByteLength(joined) <= firstTwoBytes);
  assert.ok(RSS_MAX_BYTES < 10_000_000);
});

test("RSS last build date follows the newest content modification", () => {
  const latest = getLatestRepairCaseRssDate([
    {
      created_at: "2026-11-01T09:00:00Z",
      updated_at: "2026-11-03T09:00:00Z",
    },
    {
      created_at: "2026-11-04T09:00:00Z",
      updated_at: null,
    },
  ]);

  assert.equal(latest.toISOString(), "2026-11-04T09:00:00.000Z");
});
