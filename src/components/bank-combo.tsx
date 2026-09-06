import { PartyCombo } from "@/components/party-combo";
import { newId } from "@/lib/finance/ids";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import type { RefObject } from "react";

export function BankCombo({
  valueId,
  onChoose,
  disabled,
  label = "Bank",
  placeholder = "Type a bank",
  excludeId,
  invalid,
  id,
  inputRef,
}: {
  valueId: string;
  onChoose: (id: string, name: string) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  excludeId?: string;
  invalid?: boolean;
  id?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const data = useFinanceData();
  const addBank = useFinanceStore((s) => s.addBank);
  const banks = data.banks.filter((b) => !b.archived && b.id !== excludeId);
  const current = data.banks.find((b) => b.id === valueId);
  return (
    <PartyCombo
      items={banks.map((b) => ({ id: b.id, name: b.nickname || b.name }))}
      valueId={valueId}
      valueName={current?.nickname || current?.name || ""}
      disabled={disabled}
      inputRef={inputRef}
      placeholder={placeholder}
      label={label}
      invalid={invalid}
      id={id}
      onChoose={onChoose}
      onCreate={(name) => {
        const id = newId();
        addBank({
          id,
          name,
          nickname: name,
          accountNumber: "",
          openingBalance: 0,
        });
        return { id, name };
      }}
    />
  );
}
