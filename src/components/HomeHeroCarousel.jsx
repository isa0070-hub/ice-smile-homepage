"use client";

/*
 * These are pre-generated public image files. A native img is intentional:
 * routing them through next/image would consume Vercel Image Transformations.
 */

import { useEffect, useMemo, useState } from "react";
import styles from "./HomeHeroCarousel.module.css";

const SLIDE_DURATION_MS = 6500;

const slides = [
  {
    desktopSrc: "/images/hero-repair-clean.jpg",
    mobileSrc: "/images/hero-iphone-repair-mobile.webp",
    alt: "아이스마일어게인 스마트기기 내부 점검 작업 모습",
    label: "스마트기기 내부 점검 작업",
  },
  {
    desktopSrc: "/images/hero-carousel-ipad-repair-desktop.webp",
    mobileSrc: "/images/hero-carousel-ipad-repair-mobile.webp",
    alt: "아이스마일어게인 아이패드 내부 수리 작업 모습",
    label: "아이패드 내부 수리 작업",
  },
  {
    desktopSrc: "/images/hero-carousel-notebook-repair-desktop.webp",
    mobileSrc: "/images/hero-carousel-notebook-repair-mobile.webp",
    alt: "아이스마일어게인 노트북 내부 수리 작업 모습",
    label: "노트북 내부 수리 작업",
  },
  {
    desktopSrc: "/images/hero-service-center.jpg",
    alt: "아이스마일어게인 수리센터 내부 전경과 전문 수리 작업 공간",
    label: "아이스마일어게인 수리센터 내부 전경",
  },
];

export default function HomeHeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadDeferredSlides, setLoadDeferredSlides] = useState(false);
  const [loadedSlideIndexes, setLoadedSlideIndexes] = useState(
    () => new Set([0]),
  );

  const allSlidesLoaded = useMemo(
    () => loadedSlideIndexes.size === slides.length,
    [loadedSlideIndexes],
  );

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = (event) => {
      setIsPlaying(!event.matches);
    };
    const animationFrame = window.requestAnimationFrame(() => {
      setIsPlaying(!motionQuery.matches);
    });

    motionQuery.addEventListener("change", updateMotionPreference);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      motionQuery.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    let idleCallbackId;
    let fallbackTimerId;

    const prepareDeferredSlides = () => {
      if ("requestIdleCallback" in window) {
        idleCallbackId = window.requestIdleCallback(
          () => setLoadDeferredSlides(true),
          { timeout: 1500 },
        );
        return;
      }

      fallbackTimerId = window.setTimeout(
        () => setLoadDeferredSlides(true),
        250,
      );
    };

    if (document.readyState === "complete") {
      prepareDeferredSlides();
    } else {
      window.addEventListener("load", prepareDeferredSlides, { once: true });
    }

    return () => {
      window.removeEventListener("load", prepareDeferredSlides);

      if (idleCallbackId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      }

      if (fallbackTimerId !== undefined) {
        window.clearTimeout(fallbackTimerId);
      }
    };
  }, []);

  useEffect(() => {
    if (!isPlaying || !allSlidesLoaded) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, SLIDE_DURATION_MS);

    return () => window.clearInterval(intervalId);
  }, [allSlidesLoaded, isPlaying]);

  const markSlideLoaded = (index) => {
    setLoadedSlideIndexes((currentIndexes) => {
      if (currentIndexes.has(index)) return currentIndexes;

      const nextIndexes = new Set(currentIndexes);
      nextIndexes.add(index);
      return nextIndexes;
    });
  };

  const selectSlide = (index) => {
    if (!loadedSlideIndexes.has(index)) return;

    setActiveIndex(index);
    setIsPlaying(false);
  };

  const renderedSlides = loadDeferredSlides ? slides : slides.slice(0, 1);

  return (
    <div
      className={styles.carousel}
      role="region"
      aria-roledescription="carousel"
      aria-label="아이스마일어게인 수리 작업 및 지점 사진"
    >
      <div className={styles.slides}>
        {renderedSlides.map((slide, index) => (
          <div
            key={slide.desktopSrc}
            className={`${styles.slide} ${
              activeIndex === index ? styles.activeSlide : ""
            }`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} / ${slides.length}: ${slide.label}`}
            aria-hidden={activeIndex !== index}
          >
            <picture className={styles.picture}>
              {slide.mobileSrc && (
                <source
                  media="(max-width: 768px)"
                  srcSet={slide.mobileSrc}
                  width="750"
                  height="1200"
                />
              )}
              <img
                className={styles.image}
                src={slide.desktopSrc}
                alt={slide.alt}
                width={slide.width || 1600}
                height={slide.height || 900}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "low"}
                decoding="async"
                onLoad={() => markSlideLoaded(index)}
              />
            </picture>
          </div>
        ))}
      </div>

      <div className={styles.controls} aria-label="사진 슬라이드 제어">
        <div className={styles.dots}>
          {slides.map((slide, index) => {
            const isLoaded = loadedSlideIndexes.has(index);

            return (
              <button
                key={slide.desktopSrc}
                type="button"
                className={`${styles.dot} ${
                  activeIndex === index ? styles.activeDot : ""
                }`}
                onClick={() => selectSlide(index)}
                aria-label={`${index + 1}번 사진 보기 및 자동 전환 멈춤: ${slide.label}`}
                aria-current={activeIndex === index ? "true" : undefined}
                disabled={!isLoaded}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
