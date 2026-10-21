const HANDLED_EVENT_KEY = Symbol.for(
  "ismile.ad-contact-event-handled"
);

const CONTACT_SELECTOR =
  "a[href], button, [role='button'], [data-ga-contact]";

export function createAdContactClickHandler({
  classifyContactClick,
  trackPaidAction,
  trackAnalytics,
  cleanLabel,
  hasPhoneListOpenInSession,
  markPhoneListOpenInSession,
}) {
  return function handleContactClick(event) {
    if (
      !event ||
      event[HANDLED_EVENT_KEY] ||
      !event.target ||
      typeof event.target.closest !== "function"
    ) {
      return false;
    }

    const clickedElement = event.target.closest(
      CONTACT_SELECTOR
    );

    if (!clickedElement) {
      return false;
    }

    const contactEvent =
      classifyContactClick(clickedElement);

    if (!contactEvent) {
      return false;
    }

    if (
      contactEvent.eventName === "phone_list_open" &&
      hasPhoneListOpenInSession()
    ) {
      return false;
    }

    // React StrictMode 재마운트나 잠깐 겹친 리스너가 동일한 DOM 이벤트를
    // 두 번 처리하지 않도록 이벤트 객체 자체에 표시한다.
    event[HANDLED_EVENT_KEY] = true;

    void trackPaidAction(contactEvent.eventName, {
      contactType: contactEvent.contactType,
      linkText: cleanLabel(clickedElement.textContent),
      linkUrl: contactEvent.linkUrl,
    });

    // GA가 차단되거나 아직 준비되지 않아도 자체 광고행동 기록은 위에서
    // 독립적으로 수행된다.
    trackAnalytics?.(contactEvent, clickedElement);

    if (contactEvent.eventName === "phone_list_open") {
      markPhoneListOpenInSession();
    }

    return true;
  };
}

export function registerAdContactClickTracking(
  eventTarget,
  handler
) {
  eventTarget.addEventListener("click", handler, true);

  return () => {
    eventTarget.removeEventListener(
      "click",
      handler,
      true
    );
  };
}
