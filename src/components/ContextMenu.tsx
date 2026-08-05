"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  HiOutlineDownload,
  HiOutlineMail,
  HiOutlineArrowUp,
  HiOutlineArrowLeft,
  HiOutlineRefresh,
} from "react-icons/hi";
import { AiOutlineGithub, AiOutlineLinkedin } from "react-icons/ai";
import contact from "@/content/contact";
import { usePrefersReducedMotion } from "@/lib/motion";
import type { Locale } from "@/lib/i18n";
import { t } from "@/i18n/ui";

/**
 * Custom right-click context menu, mounted once in the locale layout.
 *
 * Replaces the native browser menu with quick actions: a "Connect" group
 * (resume download, GitHub, LinkedIn, email) and a "Page" group (scroll to
 * top, back, refresh). The native menu is preserved on editable elements
 * (inputs, textareas, contenteditable) and text selections so copy/paste
 * still works. Closes on click, Escape, scroll, or resize; supports arrow-key
 * navigation between items.
 */

const RESUME_HREF = "/Resume - External.pdf";

interface MenuPosition {
  x: number;
  y: number;
}

/** True when the right-click target should keep the native browser menu. */
function shouldUseNativeMenu(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest("input, textarea, [contenteditable='true']")) return true;
  // Keep the native menu when text is selected (copy, search selection, etc.)
  const selection = window.getSelection();
  return !!selection && !selection.isCollapsed;
}

function MenuItem({
  icon,
  label,
  trailing,
  onSelect,
  href,
  download,
}: {
  icon: ReactNode;
  label: string;
  /** Right-aligned hint: keyboard shortcut or badge. */
  trailing?: ReactNode;
  onSelect?: () => void;
  href?: string;
  download?: boolean;
}) {
  const className =
    "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-start text-[15px] text-[var(--color-text-primary)] outline-none transition-colors hover:bg-[var(--color-surface)] focus-visible:bg-[var(--color-surface)]";

  const content = (
    <>
      <span aria-hidden="true" className="text-[var(--color-text-secondary)]">
        {icon}
      </span>
      <span>{label}</span>
      {trailing && <span className="ms-auto">{trailing}</span>}
    </>
  );

  if (href) {
    return (
      <a
        role="menuitem"
        href={href}
        download={download}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        className={className}
        onClick={onSelect}
      >
        {content}
      </a>
    );
  }

  return (
    <button role="menuitem" type="button" className={className} onClick={onSelect}>
      {content}
    </button>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div
      role="presentation"
      className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
    >
      {children}
    </div>
  );
}

function Shortcut({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-xs text-[var(--color-text-muted)]">
      {children}
    </span>
  );
}

export function ContextMenu({ locale = "en" }: { locale?: Locale }) {
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const dict = t(locale).contextMenu;

  const close = useCallback(() => setPosition(null), []);

  // Intercept right-click anywhere on the page.
  useEffect(() => {
    const onContextMenu = (event: MouseEvent) => {
      if (shouldUseNativeMenu(event.target)) {
        setPosition(null);
        return;
      }
      event.preventDefault();
      setPosition({ x: event.clientX, y: event.clientY });
    };
    document.addEventListener("contextmenu", onContextMenu);
    return () => document.removeEventListener("contextmenu", onContextMenu);
  }, []);

  // Dismissal: any click outside, scroll, resize, or Escape.
  useEffect(() => {
    if (!position) return;

    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        close();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
    };
  }, [position, close]);

  // Clamp the menu inside the viewport and focus the first item.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu || !position) return;

    const { innerWidth, innerHeight } = window;
    const rect = menu.getBoundingClientRect();
    const x = Math.min(position.x, innerWidth - rect.width - 8);
    const y = Math.min(position.y, innerHeight - rect.height - 8);
    menu.style.left = `${Math.max(8, x)}px`;
    menu.style.top = `${Math.max(8, y)}px`;

    menu.querySelector<HTMLElement>("[role='menuitem']")?.focus();
  }, [position]);

  /** Roving focus between menu items with the arrow keys. */
  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']") ?? [],
    );
    if (items.length === 0) return;
    const current = items.indexOf(document.activeElement as HTMLElement);
    const delta = event.key === "ArrowDown" ? 1 : -1;
    const next = (current + delta + items.length) % items.length;
    items[next].focus();
  };

  if (!position) return null;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    close();
  };

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={dict.menuLabel}
      onKeyDown={onMenuKeyDown}
      className="fixed z-[100] w-64 rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-surface-elevated)] p-2 shadow-2xl"
      style={{ left: position.x, top: position.y }}
    >
      <GroupLabel>{dict.connect}</GroupLabel>
      <MenuItem
        icon={<HiOutlineDownload size={18} />}
        label={dict.downloadResume}
        href={RESUME_HREF}
        download
        onSelect={close}
        trailing={
          <span className="rounded bg-[var(--color-rose-glow)] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-[var(--color-accent)]">
            PDF
          </span>
        }
      />
      <MenuItem
        icon={<AiOutlineGithub size={18} />}
        label={dict.github}
        href={contact.githubUrl}
        onSelect={close}
      />
      <MenuItem
        icon={<AiOutlineLinkedin size={18} />}
        label={dict.linkedin}
        href={contact.linkedinUrl}
        onSelect={close}
      />
      <MenuItem
        icon={<HiOutlineMail size={18} />}
        label={dict.sendEmail}
        href={`mailto:${contact.email}`}
        onSelect={close}
      />

      <div role="separator" className="mx-2 my-1.5 border-t border-[var(--color-border)]" />

      <GroupLabel>{dict.page}</GroupLabel>
      <MenuItem
        icon={<HiOutlineArrowUp size={18} />}
        label={dict.scrollToTop}
        onSelect={scrollToTop}
        trailing={<Shortcut>Home</Shortcut>}
      />
      <MenuItem
        icon={
          <HiOutlineArrowLeft size={18} className="rtl:-scale-x-100" />
        }
        label={dict.goBack}
        onSelect={() => {
          close();
          window.history.back();
        }}
        trailing={<Shortcut>Alt+←</Shortcut>}
      />
      <MenuItem
        icon={<HiOutlineRefresh size={18} />}
        label={dict.refresh}
        onSelect={() => {
          close();
          window.location.reload();
        }}
        trailing={<Shortcut>F5</Shortcut>}
      />
    </div>
  );
}

export default ContextMenu;
