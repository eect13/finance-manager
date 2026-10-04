import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { maskTypedDate, setDateFormatPref, typedToIso } from "./format.ts";

/** Pinned so expandYear(26) / expandYear(92) match the documented books. */
const TODAY = "2026-09-27";

/**
 * MDY month is the first slash field. A slashless value such as "13"
 * is the day-of-month shortcut, not month 13.
 */
function monthField(mask: string): number | null {
  if (!mask.includes("/")) return null;
  const month = mask.split("/")[0];
  if (!month) return null;
  return Number(month);
}

function assertSameCalendar(input: string, iso: string): void {
  const shown = maskTypedDate(input);
  const fromMask = typedToIso(shown, TODAY);
  const fromRaw = typedToIso(input, TODAY);
  assert.equal(fromRaw, iso, `typedToIso(${input})`);
  assert.equal(fromMask, iso, `typedToIso(mask ${input} → ${shown})`);
  assert.notEqual(monthField(shown), 13, `${input} → ${shown}`);
  if (!iso) return;
  const [year, month, day] = iso.split("-").map(Number);
  const fields = shown.split("/").filter((part) => part.length > 0);
  assert.ok(fields.length >= 2, shown);
  assert.equal(Number(fields[0]), month, `month of ${shown}`);
  assert.equal(Number(fields[1]), day, `day of ${shown}`);
  if (fields.length >= 3) {
    const ys = fields[2] ?? "";
    const shownYear = ys.length === 4 ? Number(ys) : year;
    assert.equal(shownYear, year, `year of ${shown}`);
    if (ys.length < 4) assert.equal(Number(ys), year % 100, `yy of ${shown}`);
  } else {
    assert.equal(year, Number(TODAY.slice(0, 4)));
  }
}

describe("date mask and typedToIso are the same calendar day", () => {
  it("keeps documented QuickBooks dates and fixes the mask/ISO split", () => {
    setDateFormatPref("MDY");

    assertSameCalendar("11226", "2026-01-12");
    assertSameCalendar("12126", "2026-01-21");
    assertSameCalendar("1/2/26", "2026-01-02");
    assertSameCalendar("09131992", "1992-09-13");
    assertSameCalendar("091392", "1992-09-13");
    assertSameCalendar("91326", "2026-09-13");

    assert.equal(maskTypedDate("11226"), "1/12/26");
    assert.equal(maskTypedDate("12126"), "1/21/26");
    assert.equal(maskTypedDate("1/2/26"), "1/2/26");
    assert.equal(maskTypedDate("09131992"), "09/13/1992");
    assert.equal(maskTypedDate("091392"), "09/13/92");
    assert.equal(maskTypedDate("91326"), "9/13/26");

    assert.equal(typedToIso("09131992", TODAY), "1992-09-13");
    assert.equal(typedToIso("091392", TODAY), "1992-09-13");
    assert.equal(typedToIso("91326", TODAY), "2026-09-13");
    assert.equal(typedToIso("091326", TODAY), "2026-09-13");
    assert.equal(typedToIso("0913", TODAY), "2026-09-13");
    assert.equal(typedToIso("9/13/2026", TODAY), "2026-09-13");
    assert.equal(typedToIso("2026-09-13", TODAY), "2026-09-13");
    assert.equal(typedToIso("02312026", TODAY), "");
  });

  it("never displays month 13", () => {
    setDateFormatPref("MDY");
    const inputs = [
      "13",
      "132",
      "1326",
      "1301",
      "130126",
      "13011992",
      "13/01/1992",
      "13/2/26",
      "011326",
      "1132",
      "11226",
      "12126",
      "1/2/26",
      "09131992",
      "091392",
      "91326",
      "02312026",
    ];
    for (let n = 0; n <= 99999; n++) inputs.push(String(n));
    for (const input of inputs) {
      const shown = maskTypedDate(input);
      const month = monthField(shown);
      assert.notEqual(month, 13, `${input} → ${shown}`);
      assert.equal(typedToIso(shown, TODAY), typedToIso(input, TODAY), `${input} → ${shown}`);
    }
  });
});
