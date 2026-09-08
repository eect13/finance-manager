import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  birMonthlyCents,
  computePhPayroll,
  monthlyFromPeriod,
  periodPayAmount,
  periodShare,
  sssMscCents,
} from "./ph-payroll.ts";

describe("PH statutory 2026", () => {
  it("maps MSC brackets (floor 5k, ceiling 35k)", () => {
    assert.equal(sssMscCents(400_000), 500_000);
    assert.equal(sssMscCents(524_900), 500_000);
    assert.equal(sssMscCents(525_000), 550_000);
    assert.equal(sssMscCents(1_000_000), 1_000_000);
    assert.equal(sssMscCents(4_500_000), 3_500_000);
  });

  it("TRAIN monthly withholding", () => {
    assert.equal(birMonthlyCents(2_000_000), 0);
    assert.equal(birMonthlyCents(2_083_300), 0);
    assert.equal(birMonthlyCents(3_333_300), Math.round((3_333_300 - 2_083_300) * 0.15));
  });

  it("monthly ₱45,000 salary: SSS ceiling, PhilHealth 5%, Pag-IBIG cap, TRAIN", () => {
    const p = computePhPayroll({ gross: 4_500_000, period: "monthly", statutory: true });
    assert.equal(p.sssEe, 175_000);
    assert.equal(p.sssEr, 350_000);
    assert.equal(p.sssEc, 3_000);
    assert.equal(p.philEe, 112_500);
    assert.equal(p.philEr, 112_500);
    assert.equal(p.pagEe, 20_000);
    assert.equal(p.pagEr, 20_000);
    const taxable = 4_500_000 - 175_000 - 112_500 - 20_000;
    assert.equal(p.bir, birMonthlyCents(taxable));
    assert.equal(p.net, 4_500_000 - p.employeeDeduct);
    assert.ok(p.net > 0);
  });

  it("semimonthly is half of monthly (period share)", () => {
    const month = computePhPayroll({ gross: 4_500_000, period: "monthly", statutory: true });
    const halfGross = periodShare(4_500_000, "semimonthly");
    const semi = computePhPayroll({ gross: halfGross, period: "semimonthly", statutory: true });
    assert.equal(semi.sssEe, periodShare(month.sssEe, "semimonthly"));
    assert.equal(monthlyFromPeriod(halfGross, "semimonthly"), 4_500_000);
  });

  it("off statutory is gross minus extra only", () => {
    const p = computePhPayroll({ gross: 100_000, period: "monthly", statutory: false, extra: 10_000 });
    assert.equal(p.sssEe, 0);
    assert.equal(p.bir, 0);
    assert.equal(p.net, 90_000);
  });

  it("period pay for salary slices the monthly rate", () => {
    assert.equal(periodPayAmount(4_500_000, "monthly", "salary"), 4_500_000);
    assert.equal(periodPayAmount(4_500_000, "semimonthly", "salary"), 2_250_000);
    assert.equal(periodPayAmount(35_000, "weekly", "hourly"), 0);
  });
});
