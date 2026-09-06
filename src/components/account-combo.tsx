import { PartyCombo } from "@/components/party-combo";
import { newId } from "@/lib/finance/ids";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import type { AccountType } from "@/lib/finance/types";
import type { RefObject } from "react";

export function AccountCombo({
  valueId,
  onChoose,
  disabled,
  label = "Account",
  placeholder = "Type an account",
  type = "expense",
  invalid,
  id,
  inputRef,
}: {
  valueId: string;
  onChoose: (id: string, name: string) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  type?: AccountType;
  invalid?: boolean;
  id?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const data = useFinanceData();
  const addAccount = useFinanceStore((s) => s.addAccount);
  const accounts = data.accounts.filter((a) => a.type === type && !a.bankId);
  const current = data.accounts.find((a) => a.id === valueId);
  return (
    <PartyCombo
      items={accounts.map((a) => ({ id: a.id, name: `${a.code} · ${a.name}` }))}
      valueId={valueId}
      valueName={current ? `${current.code} · ${current.name}` : ""}
      disabled={disabled}
      inputRef={inputRef}
      placeholder={placeholder}
      label={label}
      invalid={invalid}
      id={id}
      onChoose={onChoose}
      onCreate={(name) => {
        const id = newId();
        addAccount({ id, name, type });
        return { id, name };
      }}
    />
  );
}
