import { Children, cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { Label } from "@/components/ui/label";

function existingId(node: ReactNode): string | undefined {
  if (!isValidElement(node)) return undefined;
  const id = (node.props as { id?: unknown }).id;
  return typeof id === "string" && id ? id : undefined;
}

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  const autoId = useId();
  const kids = Children.toArray(children);
  const first = kids[0];
  const given = htmlFor || existingId(first);
  const id = given || autoId;
  const wired =
    !given && isValidElement(first)
      ? [cloneElement(first as ReactElement<{ id?: string }>, { id }), ...kids.slice(1)]
      : children;

  return (
    <div className="flex flex-col gap-2">
      <Label
        htmlFor={id}
        onClick={(event) => {
          const wrap = event.currentTarget.parentElement;
          if (!wrap) return;
          const control = wrap.querySelector<HTMLElement>(
            `#${CSS.escape(id)}, input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button[role="combobox"], [role="combobox"]`,
          );
          control?.focus();
        }}
      >
        {label}
      </Label>
      {wired}
    </div>
  );
}
