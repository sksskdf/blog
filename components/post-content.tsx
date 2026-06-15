"use client";

import { useState } from "react";
import { useCodeCopyButtons } from "../hooks/use-code-copy";

interface PostContentProps {
  html: string;
  className?: string;
}

/**
 * Renders pre-processed post HTML and enhances it on the client (copy buttons
 * on code blocks). Used by the server-rendered post detail page.
 */
export default function PostContent({ html, className }: PostContentProps) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  useCodeCopyButtons(el, html);

  return (
    <div
      ref={setEl}
      className={className ?? "prose prose-invert max-w-none"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
