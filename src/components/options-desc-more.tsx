import type { ReactNode } from "react";
import { usePhoneUi } from "@/lib/phone-layout";
import { CardDescription } from "@/components/ui/card";

/** On phone, long Options blurbs collapse behind More. Desktop shows full text. */
export function OptionsDescMore({ children }: { children: ReactNode }) {
  const phone = usePhoneUi();
  if (!phone) return <CardDescription>{children}</CardDescription>;
  return (
    <details className="card-desc-more">
      <summary>More</summary>
      <CardDescription className="mt-1">{children}</CardDescription>
    </details>
  );
}
