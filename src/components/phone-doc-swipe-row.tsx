import type { ReactNode } from "react";
import { PhoneSwipe, type PhoneSwipeAction } from "@/components/phone-swipe";
import { usePhoneUi } from "@/lib/phone-layout";
import { cn } from "@/lib/utils";

/**
 * Phone: one table row = colspan cell with swipe reveal.
 * Desktop: render children as normal <tr> contents via `desktopRow`.
 */
export function PhoneDocSwipeRow({
  colSpan,
  actions,
  children,
  className,
  desktopRow,
}: {
  colSpan: number;
  actions: PhoneSwipeAction[];
  /** Phone row face (grid of fields). */
  children: ReactNode;
  className?: string;
  /** Full <tr>...</tr> for desktop. */
  desktopRow: ReactNode;
}) {
  const phone = usePhoneUi();
  if (!phone) return <>{desktopRow}</>;
  return (
    <tr className={cn("border-b border-border/70 last:border-0", className)}>
      <td colSpan={colSpan} className="!p-0">
        <PhoneSwipe enabled={actions.length > 0} actions={actions} className="doc-phone-swipe">
          <div className="doc-phone-swipe-face px-3 py-2.5 touch-manipulation">{children}</div>
        </PhoneSwipe>
      </td>
    </tr>
  );
}
