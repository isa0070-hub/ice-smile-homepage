import assert from "node:assert/strict";
import test from "node:test";

import {
  createAdContactClickHandler,
  registerAdContactClickTracking,
} from "../src/lib/adContactTracking.js";

function fixture({ analyticsReady = false } = {}) {
  const paid = [];
  const analytics = [];
  let phoneListOpen = false;
  const element = { textContent: "전화 상담" };

  const handler = createAdContactClickHandler({
    classifyContactClick: () => ({
      eventName: "phone_click",
      contactType: "phone",
      linkUrl: "tel:000",
    }),
    trackPaidAction: (...args) => paid.push(args),
    trackAnalytics: (...args) => {
      if (analyticsReady) analytics.push(args);
    },
    cleanLabel: (value) => value.trim(),
    hasPhoneListOpenInSession: () => phoneListOpen,
    markPhoneListOpenInSession: () => {
      phoneListOpen = true;
    },
  });

  return {
    paid,
    analytics,
    element,
    handler,
    event: {
      target: { closest: () => element },
    },
    enableAnalytics() {
      analyticsReady = true;
    },
  };
}

test("paid action is recorded when GA is blocked", () => {
  const subject = fixture();

  assert.equal(subject.handler(subject.event), true);
  assert.equal(subject.paid.length, 1);
  assert.equal(subject.analytics.length, 0);
  assert.deepEqual(subject.paid[0], [
    "phone_click",
    {
      contactType: "phone",
      linkText: "전화 상담",
      linkUrl: "tel:000",
    },
  ]);
});

test("GA can become ready later without changing paid tracking", () => {
  const subject = fixture();

  subject.handler(subject.event);
  subject.enableAnalytics();
  subject.handler({ target: subject.event.target });

  assert.equal(subject.paid.length, 2);
  assert.equal(subject.analytics.length, 1);
});

test("the same DOM event is handled once across duplicate listeners", () => {
  const first = fixture({ analyticsReady: true });
  const second = fixture({ analyticsReady: true });

  assert.equal(first.handler(first.event), true);
  assert.equal(second.handler(first.event), false);
  assert.equal(first.paid.length, 1);
  assert.equal(second.paid.length, 0);
});

test("registration cleanup supports StrictMode remounts and route changes", () => {
  const calls = [];
  const eventTarget = {
    addEventListener: (...args) => calls.push(["add", ...args]),
    removeEventListener: (...args) => calls.push(["remove", ...args]),
  };
  const handler = () => {};

  const cleanup = registerAdContactClickTracking(
    eventTarget,
    handler
  );
  cleanup();

  assert.deepEqual(calls, [
    ["add", "click", handler, true],
    ["remove", "click", handler, true],
  ]);
});

test("phone-list open remains once per session", () => {
  let opened = false;
  let paidCount = 0;
  const element = { textContent: "전화번호 보기" };
  const handler = createAdContactClickHandler({
    classifyContactClick: () => ({
      eventName: "phone_list_open",
      contactType: "phone_list",
      linkUrl: "",
    }),
    trackPaidAction: () => {
      paidCount += 1;
    },
    cleanLabel: (value) => value,
    hasPhoneListOpenInSession: () => opened,
    markPhoneListOpenInSession: () => {
      opened = true;
    },
  });
  const makeEvent = () => ({
    target: { closest: () => element },
  });

  assert.equal(handler(makeEvent()), true);
  assert.equal(handler(makeEvent()), false);
  assert.equal(paidCount, 1);
});
