import { useEffect } from "react";

/**
 * Injects a "복사" (copy) button into every <pre> code block inside the given
 * container. Runs whenever the container or the rendered content changes.
 *
 * Designed for content rendered via dangerouslySetInnerHTML, where React does
 * not own the code-block DOM.
 */
export function useCodeCopyButtons(
  container: HTMLElement | null,
  contentKey?: string | null
): void {
  useEffect(() => {
    if (!container) return;

    const cleanups: Array<() => void> = [];

    const blocks = container.querySelectorAll<HTMLPreElement>("pre");
    blocks.forEach((pre) => {
      // Avoid double-injecting on re-runs.
      if (pre.querySelector("[data-copy-button]")) return;

      pre.classList.add("group", "relative");

      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-copy-button", "");
      button.textContent = "복사";
      button.className =
        "absolute top-2 right-2 px-2 py-1 text-xs font-mono rounded border " +
        "border-dark-border-subtle bg-dark-card text-dark-muted " +
        "opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity " +
        "hover:border-brand-green hover:text-brand-green";

      const handleClick = async (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const code = pre.querySelector("code");
        const text = (code ?? pre).innerText;
        try {
          await navigator.clipboard.writeText(text);
          button.textContent = "복사됨";
          window.setTimeout(() => {
            button.textContent = "복사";
          }, 1500);
        } catch {
          button.textContent = "실패";
          window.setTimeout(() => {
            button.textContent = "복사";
          }, 1500);
        }
      };

      button.addEventListener("click", handleClick);
      pre.appendChild(button);

      cleanups.push(() => {
        button.removeEventListener("click", handleClick);
        button.remove();
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [container, contentKey]);
}
