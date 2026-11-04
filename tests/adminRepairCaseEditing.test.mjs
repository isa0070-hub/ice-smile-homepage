import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adminContentSource = readFileSync(
  new URL("../src/lib/adminContent.js", import.meta.url),
  "utf8",
);
const editPageSource = readFileSync(
  new URL("../src/app/admin/repair-cases/edit/[id]/page.js", import.meta.url),
  "utf8",
);

test("repair-case PATCH only replaces optional structured fields when supplied", () => {
  for (const field of ["blog_url", "blog_title", "content_sections"]) {
    assert.match(
      adminContentSource,
      new RegExp(`creating \\|\\| Object\\.hasOwn\\(payload, "${field}"\\)`),
    );
  }

  assert.match(
    adminContentSource,
    /parseRepairCaseContentSections\(value\)/,
  );
  assert.match(
    adminContentSource,
    /text\(payload\?\.slug, "SEO 주소", \{ required: true, max: 160 \}\)/,
  );
});

test("repair-case editor protects URLs and round-trips structured content", () => {
  assert.match(editPageSource, /parseRepairCaseContentSections\(rawSections\)/);
  assert.match(editPageSource, /contentSectionsDirty[\s\S]*content_sections/);
  assert.match(editPageSource, /readOnly=\{!slugEditing\}/);
  assert.match(editPageSource, /기존 검색 URL이 끊길 수 있습니다/u);
  assert.match(
    editPageSource,
    /previousKeyword === previousAutomaticKeyword/,
  );
  assert.match(editPageSource, /previousAlt === previousAutomaticAlt/);
  assert.match(editPageSource, /value=\{image\.sort_order \?\? index\}/);
  assert.match(editPageSource, /const sortOrder = nextSortOrder \+ i/);
  assert.doesNotMatch(editPageSource, /setRefreshKey/);
  assert.doesNotMatch(editPageSource, /detailImages\.length \+ i \+ 1/);
});
