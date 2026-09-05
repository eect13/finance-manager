import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeBooks } from "./normalize.ts";
import { cashBook } from "./register.ts";
import { setCashRecon, finishRecon, undoLastRecon, transferBanks } from "./actions.ts";
import { journalLegRecon } from "./types.ts";
import type { FinanceData } from "./types.ts";

function bareBooks(): FinanceData {
  return normalizeBooks({
    settings: { companyName: "Test Co", currency: "PHP", fiscalYearStart: 1 },
    banks: [
      {
        id: "bank-op",
        name: "Operating",
        nickname: "Operating",
        accountNumber: "1",
        openingBalance: 0,
        accountId: "acc-op",
        archived: false,
      },
      {
        id: "bank-rs",
        name: "Reserve",
        nickname: "Reserve",
        accountNumber: "2",
        openingBalance: 0,
        accountId: "acc-rs",
        archived: false,
      },
    ],
    accounts: [
      { id: "acc-op", code: "1000", name: "Cash Op", type: "asset", bankId: "bank-op", system: true },
      { id: "acc-rs", code: "1010", name: "Cash Rs", type: "asset", bankId: "bank-rs", system: true },
      { id: "acc-eq", code: "3000", name: "Equity", type: "equity", system: true },
    ],
    journals: [
      {
        id: "j-xfer-legacy",
        date: "2026-03-01",
        description: "Transfer Operating → Reserve",
        sourceType: "transfer",
        recon: "cleared",
        lines: [
          { id: "l1", accountId: "acc-rs", debit: 100, credit: 0, memo: "" },
          { id: "l2", accountId: "acc-op", debit: 0, credit: 100, memo: "" },
        ],
      },
    ],
  });
}

describe("transfer per-leg recon", () => {
  it("normalize copies legacy journal.recon onto both legs", () => {
    const data = bareBooks();
    const j = data.journals.find((x) => x.id === "j-xfer-legacy")!;
    assert.equal(journalLegRecon(j, "bank-op"), "cleared");
    assert.equal(journalLegRecon(j, "bank-rs"), "cleared");
    assert.ok(j.reconByBank);
  });

  it("setCashRecon clears only the selected bank leg", () => {
    let data = bareBooks();
    data = setCashRecon(data, {
      kind: "transfer",
      sourceId: "j-xfer-legacy",
      bankId: "bank-op",
      recon: "pending",
    });
    const j = data.journals.find((x) => x.id === "j-xfer-legacy")!;
    assert.equal(journalLegRecon(j, "bank-op"), "pending");
    assert.equal(journalLegRecon(j, "bank-rs"), "cleared");

    const opLines = cashBook(data, "bank-op").lines.filter((l) => l.kind === "transfer");
    const rsLines = cashBook(data, "bank-rs").lines.filter((l) => l.kind === "transfer");
    assert.equal(opLines[0]?.recon, "pending");
    assert.equal(rsLines[0]?.recon, "cleared");
  });

  it("finish statement reconciles only that bank's transfer leg", () => {
    let data = bareBooks();
    // Clear both first so uncleared includes them as cleared-eligible... uncleared is recon !== reconciled
    data = setCashRecon(data, {
      kind: "transfer",
      sourceId: "j-xfer-legacy",
      bankId: "bank-op",
      recon: "cleared",
    });
    const opBook = cashBook(data, "bank-op");
    // opening may be 0; finish needs difference 0 — use statement ending = beginning + cleared net
    // For a single credit transfer of 100 on Operating: payment 100
    // beginning with no prior history = opening + already-R = 0
    // ticked payment 100 → cleared net -100 → ending must be -100
    data = finishRecon(data, {
      bankId: "bank-op",
      statementDate: "2026-03-31",
      statementEnding: -100,
      lines: [{ kind: "transfer", sourceId: "j-xfer-legacy" }],
    });
    const j = data.journals.find((x) => x.id === "j-xfer-legacy")!;
    assert.equal(journalLegRecon(j, "bank-op"), "reconciled");
    assert.equal(journalLegRecon(j, "bank-rs"), "cleared");

    data = undoLastRecon(data, "bank-op");
    const j2 = data.journals.find((x) => x.id === "j-xfer-legacy")!;
    assert.equal(journalLegRecon(j2, "bank-op"), "pending");
    assert.equal(journalLegRecon(j2, "bank-rs"), "cleared");
  });

  it("new transfers start with pending reconByBank on both banks", () => {
    let data = bareBooks();
    data = transferBanks(data, {
      date: "2026-04-01",
      fromId: "bank-op",
      toId: "bank-rs",
      amount: 50,
      memo: "Test xfer",
    });
    const j = data.journals.filter((x) => x.sourceType === "transfer").at(-1)!;
    assert.equal(journalLegRecon(j, "bank-op"), "pending");
    assert.equal(journalLegRecon(j, "bank-rs"), "pending");
  });
});
