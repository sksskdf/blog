"use client";

import { useEffect, useRef, useState } from "react";
import { TocItem } from "../types";

interface TableOfContentsProps {
  items: TocItem[];
  /**
   * Optional scroll container. When the content scrolls inside an element
   * (e.g. the post detail modal) rather than the window, pass it here so the
   * active-heading tracking is accurate.
   */
  scrollRoot?: HTMLElement | null;
  /** Whether to render the "목차" heading. Defaults to true. */
  showHeading?: boolean;
}

export default function TableOfContents({
  items,
  scrollRoot,
  showHeading = true,
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (items.length === 0) return;

    const headingElements: HTMLElement[] = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    if (headingElements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible heading
        const visibleEntries = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visibleEntries.length > 0) {
          setActiveId(visibleEntries[0].target.id);
        }
      },
      {
        root: scrollRoot ?? null,
        rootMargin: "0px 0px -60% 0px",
        threshold: 0,
      }
    );

    headingElements.forEach((el) => observerRef.current!.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [items, scrollRoot]);

  if (items.length === 0) return null;

  const minLevel = Math.min(...items.map((i) => i.level));

  return (
    <nav aria-label="목차">
      {showHeading && (
        <h3 className="font-mono text-sm text-brand-green mb-3" aria-label="Table of Contents">목차</h3>
      )}
      <ul className="space-y-1">
        {items.map((item) => {
          const indent = (item.level - minLevel) * 12;
          const isActive = activeId === item.id;
          return (
            <li key={item.id} style={{ paddingLeft: `${indent}px` }}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(item.id);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                    setActiveId(item.id);
                  }
                }}
                className={`block text-xs font-mono leading-relaxed py-0.5 transition-colors duration-150 truncate ${
                  isActive
                    ? "text-brand-green"
                    : "text-dark-muted hover:text-dark-text"
                }`}
                title={item.text}
              >
                {isActive && (
                  <span className="mr-1 text-brand-green">›</span>
                )}
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
