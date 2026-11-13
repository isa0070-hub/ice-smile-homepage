import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const createPageSource = readFileSync(
  new URL("../src/app/admin/repair-cases/page.js", import.meta.url),
  "utf8",
);
const detailPageSource = readFileSync(
  new URL("../src/app/repair-cases/[slug]/page.js", import.meta.url),
  "utf8",
);
const adminContentSource = readFileSync(
  new URL("../src/lib/adminContent.js", import.meta.url),
  "utf8",
);
const editPageSource = readFileSync(
  new URL(
    "../src/app/admin/repair-cases/edit/[id]/page.js",
    import.meta.url,
  ),
  "utf8",
);

test("repair-case creation keeps SEO facts separate from optional rich content", () => {
  assert.match(createPageSource, /const \[stageDetails, setStageDetails\]/u);
  assert.match(createPageSource, /const \[extraSections, setExtraSections\]/u);
  assert.match(createPageSource, /const \[closingSection, setClosingSection\]/u);
  assert.match(createPageSource, /composeRepairCaseContentSections/u);
  assert.match(createPageSource, /content_sections:\s*contentSections/u);
  assert.match(createPageSource, /repair_content:\s*introContent/u);
  assert.match(createPageSource, /검색용 상세 본문/u);
  assert.match(createPageSource, /단계별 상세 설명/u);
  assert.match(createPageSource, /과정 구간 추가/u);
  assert.match(createPageSource, /마무리 구간 추가/u);
});

test("content quality guidance stays non-blocking while incomplete added sections are explicit", () => {
  const canSubmitBlock = createPageSource.match(
    /const canSubmit =([\s\S]*?);\n\n  function handleFactChange/u,
  )?.[1];

  assert.ok(canSubmitBlock);
  assert.doesNotMatch(canSubmitBlock, /contentQuality/u);
  assert.match(canSubmitBlock, /supplementarySectionErrors\.length === 0/u);
  assert.match(createPageSource, /네이버가 정한 최소 글자 수는 없습니다/u);
  assert.match(createPageSource, /상세 본문이 짧아도 등록할 수 있습니다/u);
  assert.match(createPageSource, /setStageDetails\(\{\}\)/u);
  assert.match(createPageSource, /setExtraSections\(\[\]\)/u);
  assert.match(createPageSource, /setClosingSection\(null\)/u);
});

test("public structured paragraphs preserve author line breaks", () => {
  assert.match(
    detailPageSource,
    /const structuredProcessTextStyle = \{[\s\S]*?whiteSpace: "pre-wrap"/u,
  );
  assert.match(
    detailPageSource,
    /const closingContentTextStyle = \{[\s\S]*?whiteSpace: "pre-wrap"/u,
  );
});

test("public SEO summaries use the stored short fact while the body keeps rich details", () => {
  assert.match(createPageSource, /content_sections:\s*contentSections/u);
  assert.match(detailPageSource, /fact_summary:/u);
  assert.match(
    detailPageSource,
    /getRepairCaseSectionFactSummary\(section\)/u,
  );
  assert.match(adminContentSource, /section\.fact_summary/u);
  assert.match(adminContentSource, /검색 요약/u);
  assert.match(editPageSource, /fact_summary:\s*factSummary/u);
});
