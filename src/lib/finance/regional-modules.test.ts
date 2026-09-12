import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeBooks } from "./normalize.ts";
import { defaultPhModulesOn, normalizeRegionalModules } from "./types.ts";

describe("regional modules defaults", () => {
  it("infers on for PHP and Pacific Harbor", () => {
    assert.equal(defaultPhModulesOn({ currency: "PHP" }), true);
    assert.equal(defaultPhModulesOn({ currency: "USD", companyName: "Pacific Harbor Trading" }), true);
    assert.equal(defaultPhModulesOn({ currency: "USD", companyName: "Acme LLC" }), false);
  });

  it("normalizeBooks fills missing flags from currency", () => {
    const php = normalizeBooks({ settings: { companyName: "Co", currency: "PHP" } });
    assert.equal(php.settings.modulePhPayroll, true);
    assert.equal(php.settings.modulePh13thMonth, true);
    assert.equal(php.settings.modulePhBirExports, true);
    assert.ok(php.accounts.some((a) => a.code === "2211"));

    const usd = normalizeBooks({ settings: { companyName: "Co", currency: "USD" } });
    assert.equal(usd.settings.modulePhPayroll, false);
    assert.equal(usd.settings.modulePh13thMonth, false);
    assert.equal(usd.settings.modulePhBirExports, false);
    assert.ok(!usd.accounts.some((a) => a.code === "2211"));
    assert.equal(usd.settings.modules.usPayroll, true);
    assert.equal(usd.settings.modules.sgCpf, false);
    assert.equal(usd.settings.modules.genericVat, false);
  });

  it("infers extra modules from currency and taxEnabled", () => {
    const sgd = normalizeBooks({ settings: { companyName: "Co", currency: "SGD" } });
    assert.equal(sgd.settings.modules.sgCpf, true);
    assert.equal(sgd.settings.modules.usPayroll, false);

    const aud = normalizeBooks({ settings: { companyName: "Co", currency: "AUD" } });
    assert.equal(aud.settings.modules.auBas, true);

    const gbp = normalizeBooks({ settings: { companyName: "Co", currency: "GBP" } });
    assert.equal(gbp.settings.modules.ukPaye, true);

    const vatOn = normalizeBooks({ settings: { companyName: "Co", currency: "EUR", taxEnabled: true } });
    assert.equal(vatOn.settings.modules.genericVat, true);
    assert.equal(vatOn.settings.modules.multiCurrency, false);
  });

  it("preserves explicit extra-module false on USD books", () => {
    const books = normalizeBooks({
      settings: {
        companyName: "Co",
        currency: "USD",
        taxEnabled: true,
        modules: { usPayroll: false, sgCpf: false, genericVat: false, auBas: false, ukPaye: false, multiCurrency: true },
        secondaryCurrency: "EUR",
      },
    });
    assert.equal(books.settings.modules.usPayroll, false);
    assert.equal(books.settings.modules.genericVat, false);
    assert.equal(books.settings.modules.multiCurrency, true);
    assert.equal(books.settings.secondaryCurrency, "EUR");
  });


  it("preserves explicit false on PHP books", () => {
    const books = normalizeBooks({
      settings: {
        companyName: "Co",
        currency: "PHP",
        modulePhPayroll: false,
        modulePh13thMonth: false,
        modulePhBirExports: true,
      },
    });
    assert.equal(books.settings.modulePhPayroll, false);
    assert.equal(books.settings.modulePh13thMonth, false);
    assert.equal(books.settings.modulePhBirExports, true);
    assert.ok(!books.accounts.some((a) => a.code === "2211"));
  });

  it("normalizeRegionalModules respects booleans", () => {
    const n = normalizeRegionalModules({ currency: "PHP", modulePhPayroll: false } as never);
    assert.equal(n.modulePhPayroll, false);
    assert.equal(n.modulePh13thMonth, true);
    assert.equal(n.modulePhBirExports, true);
    assert.equal(n.modules.usPayroll, false);
  });
});
