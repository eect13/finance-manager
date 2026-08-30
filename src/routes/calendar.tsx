import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { CashCalendar } from "@/components/register-calendar";

export const Route = createFileRoute("/calendar")({ component: CalendarPage });

function CalendarPage() {
  return (
    <AppShell
      title="Calendar"
      description="Cash as a month board. Click a card to open it. Drag a card onto another day to reschedule."
      wide
    >
      <CashCalendar />
    </AppShell>
  );
}
