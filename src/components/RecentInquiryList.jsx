"use client";

import { useEffect, useState } from "react";

export default function RecentInquiryList() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/public/recent-inquiries", {
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("최근 접수 조회 실패");
        }

        return response.json();
      })
      .then((result) => {
        if (!active) return;

        setItems(
          result?.ok && Array.isArray(result.items)
            ? result.items
            : []
        );
      })
      .catch(() => {
        if (active) {
          setItems([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="recent-inquiry-panel">
      <div className="recent-inquiry-header">
        <strong>최근 온라인 접수</strong>

        <span>최근 5건</span>
      </div>

      {!loaded ? (
        <p className="recent-inquiry-empty">
          최근 접수 내역을 불러오는 중입니다.
        </p>
      ) : items.length === 0 ? (
        <p className="recent-inquiry-empty">
          최근 접수 내역을 준비하고 있습니다.
        </p>
      ) : (
        <div className="recent-inquiry-list">
          {items.map((item, index) => {
            const detail = [
              item.device,
              item.model,
              item.symptom,
              item.branch,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <div
                key={`${item.phone}-${index}`}
                className="recent-inquiry-item"
              >
                <div className="recent-inquiry-customer">
                  {item.name}
                  <span> · </span>
                  {item.phone}
                </div>

                <div className="recent-inquiry-detail">
                  {detail || "수리 상담 접수"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
