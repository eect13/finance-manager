import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeAuPayg } from "./au-bas.ts";
import { convertCents } from "./fx.ts";
import { vatWorkbook } from "./generic-vat.ts";
import { normalizeBooks } from "./normalize.ts";
import { computeSgCpf, computeSgCpfForPeriod } from "./sg-cpf.ts";
import { computeUkPaye } from "./uk-paye.ts";
import { computeUsPayroll, taxOnBrackets, US_SS_WAGE_BASE } from "./us-payroll.ts";

describe("US FIT + FICA stub", () => {
  it("applies SS wage base and Medicare on full wages", () => {
    const p = computeUsPayroll(20_000_000); // $200,000
    assert.equal(p.ssWages, US_SS_WAGE_BASE);
    assert.equal(p.ssEe, Math.round(US_SS_WAGE_BASE * 0.062));
    assert.equal(p.medicareEe, Math.round(20_000_000 * 0.0145));
    assert.equal(p.additionalMedicare, 0);
    assert.ok(p.fit > 0);
    assert.equal(p.ssEr, p.ssEe);
  });

  it("adds additional Medicare over $200k", () => {
    const p = computeUsPayroll(25_000_000);
    assert.equal(p.additionalMedicare, Math.round(5_000_000 * 0.009));
  });

  it("taxOnBrackets is 10% in the first band", () => {
    assert.equal(taxOnBrackets(1_000_000), 100_000);
  });
});

describe("Singapore CPF stub", () => {
  it("caps ordinary wage at the monthly ceiling", () => {
    const p = computeSgCpf(1_200_000); // $12,000
    assert.equal(p.ordinaryWage, 800_000);
    assert.equal(p.ee, 160_000);
    assert.equal(p.er, 136_000);
  });

  it("shares a monthly computation to semimonthly", () => {
    const monthly = computeSgCpf(800_000);
    const semi = computeSgCpfForPeriod(400_000, "semimonthly");
    assert.equal(semi.ee, Math.round(monthly.ee / 2));
  });
});

describe("UK PAYE + NI stub", () => {
  it("zero tax and NI at the personal allowance", () => {
    const p = computeUkPaye(1_257_000);
    assert.equal(p.paye, 0);
    assert.equal(p.niEe, 0);
  });

  it("basic-rate PAYE on income just above the allowance", () => {
    const p = computeUkPaye(1_257_000 + 1_000_000); // +£10,000
    assert.equal(p.paye, 200_000);
    assert.ok(p.niEe > 0);
    assert.ok(p.niEr > 0);
  });
});

describe("AU PAYG stub", () => {
  it("is tax-free at the threshold and levies Medicare on the whole", () => {
    const p = computeAuPayg(1_820_000);
    assert.equal(p.payg, 0);
    assert.equal(p.medicare, Math.round(1_820_000 * 0.02));
  });

  it("applies 16% in the next band", () => {
    const p = computeAuPayg(2_820_000); // $10,000 into 16%
    assert.equal(p.payg, 160_000);
  });
});

describe("FX convert", () => {
  const rates = [
    { id: "1", from: "USD", to: "PHP", rate: 56, asOf: "2026-01-01" },
    { id: "2", from: "USD", to: "PHP", rate: 58, asOf: "2026-06-01" },
  ];
  it("uses the latest rate on or before as-of", () => {
    const jan = convertCents(100, "USD", "PHP", rates, "2026-03-01");
    assert.equal(jan.found, true);
    assert.equal(jan.cents, 5600);
    const jun = convertCents(100, "USD", "PHP", rates, "2026-09-01");
    assert.equal(jun.cents, 5800);
  });
  it("inverts a stored pair", () => {
    const back = convertCents(5800, "PHP", "USD", rates, "2026-09-01");
    assert.equal(back.found, true);
    assert.equal(back.cents, 100);
  });
  it("is identity for the same currency", () => {
    const same = convertCents(500, "USD", "USD", rates);
    assert.equal(same.cents, 500);
    assert.equal(same.rate, 1);
  });
});

describe("generic VAT workbook", () => {
  it("reads the default rate and empty months on a blank file", () => {
    const data = normalizeBooks({ settings: { companyName: "Co", currency: "EUR", taxEnabled: true, defaultTaxRate: 20 } });
    const w = vatWorkbook(data, "2026-09-12");
    assert.equal(w.rate, 20);
    assert.equal(w.taxEnabled, true);
    assert.equal(w.months.length, 0);
    assert.equal(data.settings.modules.genericVat, true);
  });
});
