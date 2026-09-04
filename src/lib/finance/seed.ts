import { format, parseISO } from "date-fns";
import { makeJournal } from "./ledger";
import type {
  Account,
  Bank,
  Bill,
  BillPayment,
  BudgetItem,
  CheckRecord,
  CheckStatus,
  Customer,
  FinanceData,
  Invoice,
  InvoiceLine,
  InvoicePayment,
  JournalEntry,
  Receipt,
  ReceiptMethod,
  RecurringItem,
  ReconStatus,
  Vendor,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";

const IDS = {
  bdo: "bank-bdo",
  bpi: "bank-bpi",
  metro: "bank-metro",
  safe: "bank-safe",
  pnb: "bank-pnb",
  cashBdo: "acct-1000",
  cashBpi: "acct-1010",
  cashMetro: "acct-1020",
  cashSafe: "acct-1030",
  cashPnb: "acct-1040",
  ar: "acct-1200",
  ap: "acct-2000",
  equity: "acct-3000",
  sales: "acct-4000",
  opex: "acct-5000",
  rent: "acct-5200",
  payroll: "acct-5300",
  utilities: "acct-5400",
  fees: "acct-5500",
  misc: "acct-5900",
  custLaguna: "cust-laguna",
  custCebu: "cust-cebu",
  custMetro: "cust-metro",
  custDavao: "cust-davao",
  custBatangas: "cust-batangas",
  custIloilo: "cust-iloilo",
  custQuezon: "cust-quezon",
  custSubic: "cust-subic",
  custHarbor: "cust-harbor",
  custApex: "cust-apex",
  custNorth: "cust-north",
  custPampanga: "cust-pampanga",
  custCagayan: "cust-cagayan",
  custBacolod: "cust-bacolod",
  custZambo: "cust-zambo",
  custBaguio: "cust-baguio",
  custClark: "cust-clark",
  custNaga: "cust-naga",
  custGensan: "cust-gensan",
  vendAyala: "vend-ayala",
  vendMeralco: "vend-meralco",
  vendSantos: "vend-santos",
  vendDelta: "vend-delta",
  vendHarbor: "vend-harbor",
  vendGlobe: "vend-globe",
  vendPetron: "vend-petron",
  vendPldt: "vend-pldt",
  vendVisao: "vend-visao",
  vendPayroll: "vend-payroll",
  vendSm: "vend-sm",
  vendLala: "vend-lala",
  vendWater: "vend-water",
  vendOffice: "vend-office",
  vendJrs: "vend-jrs",
  vendConverge: "vend-converge",
  vendPhoenix: "vend-phoenix",
  vend2go: "vend-2go",
  vendRustan: "vend-rustan",
};

export const SYSTEM_ACCOUNTS: Account[] = [
  { id: IDS.cashBdo, code: "1000", name: "Cash — BDO Checking", type: "asset", bankId: IDS.bdo, system: true },
  { id: IDS.cashBpi, code: "1010", name: "Cash — BPI Savings", type: "asset", bankId: IDS.bpi, system: true },
  { id: IDS.cashMetro, code: "1020", name: "Cash — Metrobank Payroll", type: "asset", bankId: IDS.metro, system: true },
  { id: IDS.cashSafe, code: "1030", name: "Cash — Safekeeping", type: "asset", bankId: IDS.safe, system: true },
  { id: IDS.cashPnb, code: "1040", name: "Cash — PNB (closed)", type: "asset", bankId: IDS.pnb, system: true },
  { id: IDS.ar, code: "1200", name: "Accounts Receivable", type: "asset", system: true },
  { id: IDS.ap, code: "2000", name: "Accounts Payable", type: "liability", system: true },
  { id: "acct-2200", code: "2200", name: "Output VAT Payable", type: "liability", system: true },
  { id: IDS.equity, code: "3000", name: "Opening Balance Equity", type: "equity", system: true },
  { id: IDS.sales, code: "4000", name: "Sales & Service Income", type: "income", system: true },
  { id: IDS.opex, code: "5000", name: "Operating Expenses", type: "expense", system: true },
  { id: IDS.rent, code: "5200", name: "Rent", type: "expense", system: true },
  { id: IDS.payroll, code: "5300", name: "Payroll", type: "expense", system: true },
  { id: IDS.utilities, code: "5400", name: "Utilities", type: "expense", system: true },
  { id: IDS.fees, code: "5500", name: "Professional Fees", type: "expense", system: true },
  { id: IDS.misc, code: "5900", name: "Miscellaneous", type: "expense", system: true },
];

export const SAMPLE_COMPANY_ID = "co-pacific-harbor";

/** Sample books are a live 2026 year as of this date (early Sep — books feel current). */
const AS_OF = "2026-09-03";

function P(pesos: number): number {
  return Math.round(pesos * 100);
}

function d(month: number, day: number): string {
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(iso: string, days: number): string {
  const [y, m, day] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, day + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function monthName(iso: string): string {
  return format(parseISO(iso), "MMMM");
}

function cashAccount(bankId: string): string {
  if (bankId === IDS.bdo) return IDS.cashBdo;
  if (bankId === IDS.bpi) return IDS.cashBpi;
  if (bankId === IDS.metro) return IDS.cashMetro;
  return IDS.cashSafe;
}

function checkStatus(postDate: string): CheckStatus {
  return postDate <= AS_OF ? "cleared" : "pending";
}

/** Sample books never write R — that is Reconcile → Finish statement. Cleared through as-of, pending after. */
function seedCashRecon(date: string): ReconStatus {
  return date <= AS_OF ? "cleared" : "pending";
}

export function emptyBooks(): FinanceData {
  return {
    settings: { ...DEFAULT_SETTINGS },
    banks: [],
    accounts: SYSTEM_ACCOUNTS.filter((a) => !a.bankId),
    customers: [],
    vendors: [],
    employees: [],
    invoices: [],
    bills: [],
    receipts: [],
    checks: [],
    journals: [],
    budgetItems: [],
    recurrences: [],
    reconHistory: [],
    closeHistory: [],
    audit: [],
    nextNumbers: { invoice: 1, check: {}, receipt: 1, bill: 1 },
  };
}

export function createSeed(): FinanceData {
  const banks: Bank[] = [
    {
      id: IDS.bdo,
      name: "BDO Unibank",
      nickname: "Operating",
      accountNumber: "•••• 4821",
      openingBalance: P(3_400_000),
      accountId: IDS.cashBdo,
      archived: false,
      lastStatementDate: "2026-07-31",
    },
    {
      id: IDS.bpi,
      name: "Bank of the Philippine Islands",
      nickname: "Reserve",
      accountNumber: "•••• 1190",
      openingBalance: P(486_250),
      accountId: IDS.cashBpi,
      archived: false,
      lastStatementDate: "2026-07-31",
    },
    {
      id: IDS.metro,
      name: "Metrobank",
      nickname: "Payroll",
      accountNumber: "•••• 7734",
      openingBalance: P(380_000),
      accountId: IDS.cashMetro,
      archived: false,
      lastStatementDate: "2026-07-31",
    },
    {
      id: IDS.safe,
      name: "Undeposited funds",
      nickname: "Safekeeping",
      accountNumber: "On hand",
      openingBalance: 0,
      accountId: IDS.cashSafe,
      archived: false,
    },
    {
      id: IDS.pnb,
      name: "Philippine National Bank",
      nickname: "Old operating",
      accountNumber: "•••• 0091",
      openingBalance: 0,
      accountId: IDS.cashPnb,
      archived: true,
    },
  ];

  const customers: Customer[] = [
    {
      id: IDS.custLaguna,
      name: "Laguna Foods Inc.",
      contact: "Rina Velasco",
      email: "ap@lagunafoods.ph",
      phone: "+63 49 555 0188",
      address: "Brgy. Banlic, Cabuyao, Laguna",
      terms: "Net 30",
      notes: "Preferred delivery Tuesday mornings. TIN 301-882-114-000.",
      sortOrder: 0,
    },
    {
      id: IDS.custCebu,
      name: "Cebu Marine Supply",
      contact: "Paolo Tan",
      email: "paolo@cebumarine.ph",
      phone: "+63 32 555 4410",
      address: "Mandaue City, Cebu",
      terms: "Net 15",
      notes: "",
      sortOrder: 1,
    },
    {
      id: IDS.custMetro,
      name: "Metro Clinic Group",
      contact: "Dr. Elena Cruz",
      email: "billing@metroclinic.ph",
      phone: "+63 2 8888 2200",
      address: "Ortigas Center, Pasig",
      terms: "Net 30",
      notes: "Send statements to billing desk.",
      sortOrder: 2,
    },
    {
      id: IDS.custDavao,
      name: "Davao Harvest Co.",
      contact: "Miguel Santos",
      email: "miguel@davaoharvest.ph",
      phone: "+63 82 555 9091",
      address: "Toril, Davao City",
      terms: "Due on receipt",
      notes: "",
      sortOrder: 3,
    },
    {
      id: IDS.custBatangas,
      name: "Batangas Cold Storage",
      contact: "Liza Mendoza",
      email: "ap@batangascold.ph",
      phone: "+63 43 555 2201",
      address: "Sta. Rita, Batangas",
      terms: "Net 30",
      notes: "Reefer pickups Fridays.",
      sortOrder: 4,
    },
    {
      id: IDS.custIloilo,
      name: "Iloilo Fresh Mart",
      contact: "Carlo Guanco",
      email: "carlo@iloilofresh.ph",
      phone: "+63 33 555 7712",
      address: "Jaro, Iloilo City",
      terms: "Net 15",
      notes: "",
      sortOrder: 5,
    },
    {
      id: IDS.custQuezon,
      name: "Quezon Bakery Group",
      contact: "Ana Villanueva",
      email: "billing@quezonbakery.ph",
      phone: "+63 42 555 4408",
      address: "Lucena City, Quezon",
      terms: "Net 30",
      notes: "Flour and carton runs.",
      sortOrder: 6,
    },
    {
      id: IDS.custSubic,
      name: "Subic Industrial Parts",
      contact: "Mark Dizon",
      email: "purchasing@subicparts.ph",
      phone: "+63 47 555 1180",
      address: "Subic Bay Freeport",
      terms: "Net 45",
      notes: "Duty-free packing list on every invoice.",
      sortOrder: 7,
    },
    {
      id: IDS.custHarbor,
      name: "Harbor Point Counter",
      contact: "Cashier",
      email: "counter@pacificharbor.ph",
      phone: "+63 2 8800 4410",
      address: "Unit 12, Harbor Point, Las Piñas",
      terms: "Due on receipt",
      notes: "Over-the-counter cash sales. Always this customer — never a walk-in without a name on file.",
      sortOrder: 8,
    },
    {
      id: IDS.custApex,
      name: "Apex Logistics",
      contact: "Nina Reyes",
      email: "ap@apexlogistics.ph",
      phone: "+63 2 8555 6701",
      address: "Parañaque",
      terms: "Net 30",
      notes: "",
      sortOrder: 9,
    },
    {
      id: IDS.custNorth,
      name: "North Harbor Wholesale",
      contact: "Rico Lim",
      email: "rico@northharbor.ph",
      phone: "+63 2 8555 2290",
      address: "Tondo, Manila",
      terms: "Net 15",
      notes: "",
      sortOrder: 10,
    },
    {
      id: IDS.custPampanga,
      name: "Pampanga Grain Co.",
      contact: "Beth Navarro",
      email: "beth@pampangagrain.ph",
      phone: "+63 45 555 1188",
      address: "San Fernando, Pampanga",
      terms: "Net 30",
      notes: "",
      sortOrder: 11,
    },
    {
      id: IDS.custCagayan,
      name: "Cagayan Ice Plant",
      contact: "Jun Bautista",
      email: "jun@cagayanice.ph",
      phone: "+63 78 555 4412",
      address: "Tuguegarao",
      terms: "Net 30",
      notes: "",
      sortOrder: 12,
    },
    {
      id: IDS.custBacolod,
      name: "Bacolod Sugar House",
      contact: "Lia Montelibano",
      email: "lia@bacolodsugar.ph",
      phone: "+63 34 555 2204",
      address: "Bacolod City",
      terms: "Net 15",
      notes: "",
      sortOrder: 13,
    },
    {
      id: IDS.custZambo,
      name: "Zamboanga Catch",
      contact: "Omar Hassan",
      email: "omar@zamboangacatch.ph",
      phone: "+63 62 555 3301",
      address: "Zamboanga City",
      terms: "Due on receipt",
      notes: "",
      sortOrder: 14,
    },
    {
      id: IDS.custBaguio,
      name: "Baguio Cold Chain",
      contact: "Faith Dominguez",
      email: "faith@baguiocold.ph",
      phone: "+63 74 555 1180",
      address: "Baguio City",
      terms: "Net 30",
      notes: "",
      sortOrder: 15,
    },
    {
      id: IDS.custClark,
      name: "Clark Aero Parts",
      contact: "Kevin Sy",
      email: "kevin@clarkaero.ph",
      phone: "+63 45 555 8802",
      address: "Clark Freeport",
      terms: "Net 45",
      notes: "",
      sortOrder: 16,
    },
    {
      id: IDS.custNaga,
      name: "Naga Farm Supply",
      contact: "Ella Borja",
      email: "ella@nagafarm.ph",
      phone: "+63 54 555 7703",
      address: "Naga City",
      terms: "Net 30",
      notes: "",
      sortOrder: 17,
    },
    {
      id: IDS.custGensan,
      name: "General Santos Tuna",
      contact: "Paolo Diaz",
      email: "paolo@gensantuna.ph",
      phone: "+63 83 555 4419",
      address: "General Santos City",
      terms: "Net 15",
      notes: "",
      sortOrder: 18,
    },
  ];

  const vendors: Vendor[] = [
    {
      id: IDS.vendAyala,
      name: "Ayala Land",
      contact: "Lease desk",
      email: "ar@ayalaland.com.ph",
      phone: "+63 2 7908 3000",
      address: "Makati CBD",
      terms: "Due on the 5th",
      notes: "Warehouse lease — Harbor Point.",
      accountNumber: "AL-4412",
      sortOrder: 0,
    },
    {
      id: IDS.vendMeralco,
      name: "Meralco",
      contact: "Business center",
      email: "business@meralco.com.ph",
      phone: "+63 2 16211",
      address: "Ortigas, Pasig",
      terms: "Due on receipt",
      notes: "",
      accountNumber: "M-773401",
      sortOrder: 1,
    },
    {
      id: IDS.vendSantos,
      name: "Santos & Co. CPAs",
      contact: "Atty. Liza Santos",
      email: "liza@santosco.ph",
      phone: "+63 2 8812 4400",
      address: "Salcedo Village, Makati",
      terms: "Net 15",
      notes: "Quarterly review.",
      accountNumber: "SC-2026",
      sortOrder: 2,
    },
    {
      id: IDS.vendDelta,
      name: "Delta Freight Lines",
      contact: "Dispatch",
      email: "billing@deltafreight.ph",
      phone: "+63 2 8555 0190",
      address: "Parañaque",
      terms: "Net 30",
      notes: "Southbound hauling.",
      accountNumber: "DFL-2201",
      sortOrder: 3,
    },
    {
      id: IDS.vendHarbor,
      name: "Harbor Packaging Co.",
      contact: "Nina Reyes",
      email: "nina@harborpack.ph",
      phone: "+63 2 8800 2291",
      address: "Las Piñas",
      terms: "Net 15",
      notes: "Cartons and tape.",
      accountNumber: "HP-18",
      sortOrder: 4,
    },
    {
      id: IDS.vendGlobe,
      name: "Globe Telecom",
      contact: "Enterprise desk",
      email: "biz@globe.com.ph",
      phone: "+63 2 7730 1000",
      address: "BGC, Taguig",
      terms: "Due on the 15th",
      notes: "Warehouse SIM and data.",
      accountNumber: "GLO-8821",
      sortOrder: 5,
    },
    {
      id: IDS.vendPetron,
      name: "Petron Fleet Card",
      contact: "Fleet billing",
      email: "fleet@petron.com",
      phone: "+63 2 8884 9200",
      address: "Makati",
      terms: "Due on receipt",
      notes: "Delivery trucks.",
      accountNumber: "PET-4410",
      sortOrder: 6,
    },
    {
      id: IDS.vendPldt,
      name: "PLDT Enterprise",
      contact: "Account manager",
      email: "enterprise@pldt.com.ph",
      phone: "+63 2 8888 8888",
      address: "Makati CBD",
      terms: "Due on the 20th",
      notes: "Fiber at Harbor Point.",
      accountNumber: "PLDT-1902",
      sortOrder: 7,
    },
    {
      id: IDS.vendVisao,
      name: "Visao Security Agency",
      contact: "Capt. Ramos",
      email: "billing@visaosecurity.ph",
      phone: "+63 2 8555 3310",
      address: "Pasay",
      terms: "Net 15",
      notes: "Night watch at the warehouse.",
      accountNumber: "VSA-77",
      sortOrder: 8,
    },
    {
      id: IDS.vendPayroll,
      name: "Staff payroll",
      contact: "HR desk",
      email: "payroll@pacificharbor.ph",
      phone: "+63 2 8800 4410",
      address: "Unit 12, Harbor Point, Las Piñas",
      terms: "Due on payday",
      notes: "Semi-monthly and 13th-month payroll clearing.",
      accountNumber: "PAY-2026",
      sortOrder: 9,
    },
    {
      id: IDS.vendSm,
      name: "SM Prime Holdings",
      contact: "Lease billing",
      email: "ar@smprime.com",
      phone: "+63 2 8831 1000",
      address: "Pasay",
      terms: "Due on the 10th",
      notes: "Mall stall — not the warehouse.",
      accountNumber: "SMP-2201",
      sortOrder: 10,
    },
    {
      id: IDS.vendLala,
      name: "Lalamove Corporate",
      contact: "Fleet desk",
      email: "corp@lalamove.com",
      phone: "+63 2 7795 1111",
      address: "BGC, Taguig",
      terms: "Net 15",
      notes: "",
      accountNumber: "LL-8841",
      sortOrder: 11,
    },
    {
      id: IDS.vendWater,
      name: "Manila Water",
      contact: "Business center",
      email: "business@manilawater.com",
      phone: "+63 2 1627",
      address: "Quezon City",
      terms: "Due on receipt",
      notes: "",
      accountNumber: "MW-10221",
      sortOrder: 12,
    },
    {
      id: IDS.vendOffice,
      name: "National Book Store",
      contact: "Corporate sales",
      email: "corp@nationalbookstore.com",
      phone: "+63 2 8894 1111",
      address: "Mandaluyong",
      terms: "Net 30",
      notes: "Office supplies.",
      accountNumber: "NBS-440",
      sortOrder: 13,
    },
    {
      id: IDS.vendJrs,
      name: "JRS Express",
      contact: "Account desk",
      email: "accounts@jrsexpress.ph",
      phone: "+63 2 8531 8000",
      address: "Makati",
      terms: "Net 15",
      notes: "",
      accountNumber: "JRS-19",
      sortOrder: 14,
    },
    {
      id: IDS.vendConverge,
      name: "Converge ICT",
      contact: "Enterprise",
      email: "enterprise@convergeict.com",
      phone: "+63 2 8667 1800",
      address: "Clark, Pampanga",
      terms: "Due on the 15th",
      notes: "",
      accountNumber: "CVG-331",
      sortOrder: 15,
    },
    {
      id: IDS.vendPhoenix,
      name: "Phoenix Petroleum",
      contact: "Fleet card",
      email: "fleet@phoenixfuels.ph",
      phone: "+63 82 235 8888",
      address: "Davao City",
      terms: "Net 15",
      notes: "",
      accountNumber: "PHX-77",
      sortOrder: 16,
    },
    {
      id: IDS.vend2go,
      name: "2GO Freight",
      contact: "Cargo billing",
      email: "cargo@2go.com.ph",
      phone: "+63 2 8528 7000",
      address: "Manila South Harbor",
      terms: "Net 30",
      notes: "",
      accountNumber: "2GO-104",
      sortOrder: 17,
    },
    {
      id: IDS.vendRustan,
      name: "Rustan Supercenters",
      contact: "Wholesale",
      email: "wholesale@rustans.com.ph",
      phone: "+63 2 8634 1111",
      address: "Mandaluyong",
      terms: "Net 30",
      notes: "",
      accountNumber: "RSC-12",
      sortOrder: 18,
    },
  ];

  customers.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  customers.forEach((c, i) => {
    c.sortOrder = i;
  });
  vendors.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  vendors.forEach((v, i) => {
    v.sortOrder = i;
  });

  const journals: JournalEntry[] = [];
  const invoices: Invoice[] = [];
  const bills: Bill[] = [];
  const receipts: Receipt[] = [];
  const checks: CheckRecord[] = [];
  const checkNext: Record<string, number> = { [IDS.bdo]: 4401, [IDS.bpi]: 2201, [IDS.metro]: 1101, [IDS.safe]: 1, [IDS.pnb]: 1 };
  let invoiceN = 1;
  let receiptN = 1;
  let billN = 1;

  function post(input: Parameters<typeof makeJournal>[0], id: string, recon?: ReconStatus): JournalEntry {
    const entry = { ...makeJournal(input), id, recon: recon ?? "pending" };
    journals.push(entry);
    return entry;
  }

  function addCheck(input: {
    bankId: string;
    payee: string;
    issueDate: string;
    postDate: string;
    amount: number;
    memo: string;
    accountId: string;
    vendorId?: string;
  }) {
    const id = `chk-${input.bankId}-${checkNext[input.bankId]}`;
    const checkNumber = String(checkNext[input.bankId]++);
    const journalId = `j-${id}`;
    post(
      {
        date: input.issueDate,
        description: `Check ${checkNumber} — ${input.payee}`,
        sourceType: "check",
        sourceId: id,
        lines: [
          { accountId: input.accountId, debit: input.amount, credit: 0, memo: input.memo },
          { accountId: cashAccount(input.bankId), debit: 0, credit: input.amount },
        ],
      },
      journalId,
    );
    checks.push({
      id,
      bankId: input.bankId,
      checkNumber,
      payee: input.payee,
      issueDate: input.issueDate,
      postDate: input.postDate,
      amount: input.amount,
      status: checkStatus(input.postDate),
      recon: seedCashRecon(input.postDate),
      memo: input.memo,
      accountId: input.accountId,
      journalId,
      vendorId: input.vendorId,
    });
  }

  function addInvoice(input: {
    customerId: string;
    date: string;
    dueDate: string;
    lines: Array<Omit<InvoiceLine, "id">>;
    notes: string;
    paid?: Array<{ date: string; amount: number; bankId: string; method?: ReceiptMethod; checkNumber?: string }>;
  }) {
    const n = invoiceN++;
    const id = `inv-${n}`;
    const number = `INV-2026-${String(n).padStart(3, "0")}`;
    const customer = customers.find((c) => c.id === input.customerId);
    const total = input.lines.reduce((s, l) => s + Math.round(l.quantity * l.unitPrice), 0);
    const journalId = `j-${id}`;
    post(
      {
        date: input.date,
        description: `Invoice ${number} — ${customer?.name ?? ""}`,
        sourceType: "invoice",
        sourceId: id,
        lines: [
          { accountId: IDS.ar, debit: total, credit: 0 },
          { accountId: IDS.sales, debit: 0, credit: total },
        ],
      },
      journalId,
    );
    const payments: InvoicePayment[] = [];
    let paidCents = 0;
    for (const [i, pay] of (input.paid ?? []).entries()) {
      if (pay.date > AS_OF) continue;
      const paymentId = `pay-${id}-${i + 1}`;
      const payJournal = `j-${paymentId}`;
      const method = pay.method ?? "cash";
      post(
        {
          date: pay.date,
          description: `Payment ${number} — ${customer?.name ?? ""}`,
          sourceType: "payment",
          sourceId: paymentId,
          lines: [
            { accountId: cashAccount(pay.bankId), debit: pay.amount, credit: 0 },
            { accountId: IDS.ar, debit: 0, credit: pay.amount },
          ],
        },
        payJournal,
      );
      payments.push({ id: paymentId, date: pay.date, amount: pay.amount, bankId: pay.bankId, journalId: payJournal });
      const rcptId = `rcpt-${paymentId}`;
      receipts.push({
        id: rcptId,
        number: `RCPT-2026-${String(receiptN++).padStart(3, "0")}`,
        date: pay.date,
        kind: "payment",
        method,
        checkNumber: pay.checkNumber ?? "",
        customerId: input.customerId,
        receivedFrom: customer?.name ?? "",
        bankId: pay.bankId,
        lines: [],
        invoiceId: id,
        paymentId,
        amount: pay.amount,
        taxRate: 0,
        status: "posted",
        memo: `Payment ${number}`,
        journalId: payJournal,
        sortOrder: receipts.length,
        recon: seedCashRecon(pay.date),
      });
      paidCents += pay.amount;
    }
    const status = paidCents <= 0 ? "sent" : paidCents >= total ? "paid" : "partial";
    invoices.push({
      id,
      number,
      customerId: input.customerId,
      date: input.date,
      dueDate: input.dueDate,
      lines: input.lines.map((l, i) => ({ ...l, id: `${id}-l${i + 1}` })),
      taxRate: 0,
      status,
      notes: input.notes,
      payments,
      journalId,
    });
  }

  function addCashSale(input: {
    date: string;
    receivedFrom: string;
    customerId?: string;
    bankId: string;
    description: string;
    amount: number;
    method?: ReceiptMethod;
    checkNumber?: string;
    memo: string;
  }) {
    const id = `rcpt-sale-${receiptN}`;
    const number = `RCPT-2026-${String(receiptN++).padStart(3, "0")}`;
    const journalId = `j-${id}`;
    const method = input.method ?? "cash";
    post(
      {
        date: input.date,
        description: `Receipt ${number} — ${input.receivedFrom}`,
        sourceType: "receipt",
        sourceId: id,
        lines: [
          { accountId: cashAccount(input.bankId), debit: input.amount, credit: 0 },
          { accountId: IDS.sales, debit: 0, credit: input.amount },
        ],
      },
      journalId,
    );
    receipts.push({
      id,
      number,
      date: input.date,
      kind: "cash-sale",
      method,
      checkNumber: input.checkNumber ?? "",
      customerId: input.customerId,
      receivedFrom: input.receivedFrom,
      bankId: input.bankId,
      lines: [{ id: `${id}-l1`, description: input.description, quantity: 1, unitPrice: input.amount }],
      amount: input.amount,
      taxRate: 0,
      status: "posted",
      memo: input.memo,
      journalId,
      sortOrder: receipts.length,
      recon: seedCashRecon(input.date),
    });
  }

  function addBill(input: {
    vendorId: string;
    date: string;
    dueDate: string;
    amount: number;
    accountId: string;
    memo: string;
    reference: string;
    paid?: { date: string; bankId: string };
  }) {
    const n = billN++;
    const id = `bill-${n}`;
    const number = `BILL-2026-${String(n).padStart(3, "0")}`;
    const vendor = vendors.find((v) => v.id === input.vendorId);
    const journalId = `j-${id}`;
    post(
      {
        date: input.date,
        description: `Bill ${number} — ${vendor?.name ?? ""}`,
        sourceType: "bill",
        sourceId: id,
        lines: [
          { accountId: input.accountId, debit: input.amount, credit: 0, memo: input.memo },
          { accountId: IDS.ap, debit: 0, credit: input.amount },
        ],
      },
      journalId,
    );
    const payments: BillPayment[] = [];
    let status: Bill["status"] = "open";
    if (input.paid && input.paid.date <= AS_OF) {
      const paymentId = `bp-${id}`;
      const payJournal = `j-${paymentId}`;
      post(
        {
          date: input.paid.date,
          description: `Payment ${number} — ${vendor?.name ?? ""}`,
          sourceType: "bill-payment",
          sourceId: paymentId,
          lines: [
            { accountId: IDS.ap, debit: input.amount, credit: 0 },
            { accountId: cashAccount(input.paid.bankId), debit: 0, credit: input.amount },
          ],
        },
        payJournal,
      );
      payments.push({
        id: paymentId,
        date: input.paid.date,
        amount: input.amount,
        bankId: input.paid.bankId,
        journalId: payJournal,
        recon: seedCashRecon(input.paid.date),
      });
      status = "paid";
    }
    bills.push({
      id,
      number,
      vendorId: input.vendorId,
      date: input.date,
      dueDate: input.dueDate,
      amount: input.amount,
      accountId: input.accountId,
      status,
      memo: input.memo,
      reference: input.reference,
      payments,
      journalId,
      sortOrder: bills.length,
    });
  }

  function addTransfer(date: string, amount: number, from: string, to: string, memo: string) {
    const id = `xfer-${date}`;
    post(
      {
        date,
        description: memo,
        sourceType: "transfer",
        sourceId: id,
        lines: [
          { accountId: cashAccount(to), debit: amount, credit: 0 },
          { accountId: cashAccount(from), debit: 0, credit: amount },
        ],
      },
      `j-${id}`,
      seedCashRecon(date),
    );
  }

  post(
    {
      date: "2026-01-01",
      description: "Opening balances",
      sourceType: "opening",
      sourceId: "opening",
      lines: [
        { accountId: IDS.cashBdo, debit: P(3_400_000), credit: 0 },
        { accountId: IDS.cashBpi, debit: P(486_250), credit: 0 },
        { accountId: IDS.cashMetro, debit: P(380_000), credit: 0 },
        { accountId: IDS.equity, debit: 0, credit: P(4_266_250) },
      ],
    },
    "j-opening",
  );

  const power = [17_820, 16_440, 19_100, 18_640, 21_300, 19_880, 20_050, 18_640, 19_220, 18_400, 17_650, 22_100];
  const laguna = [172_800, 168_400, 191_200, 175_000, 188_600, 179_200, 194_000, 186_400, 181_500, 176_800, 198_200, 162_400];

  for (let m = 1; m <= 12; m++) {
    addCheck({
      bankId: IDS.bdo,
      payee: "Ayala Land",
      vendorId: IDS.vendAyala,
      issueDate: d(m, 1),
      postDate: d(m, 5),
      amount: P(85_000),
      memo: "Warehouse rent",
      accountId: IDS.rent,
    });
    addCheck({
      bankId: IDS.metro,
      payee: "Staff payroll",
      vendorId: IDS.vendPayroll,
      issueDate: d(m, 13),
      postDate: d(m, 14),
      amount: P(126_400),
      memo: `1st half ${monthName(d(m, 1))}`,
      accountId: IDS.payroll,
    });
    addCheck({
      bankId: IDS.metro,
      payee: "Staff payroll",
      vendorId: IDS.vendPayroll,
      issueDate: d(m, 27),
      postDate: d(m, 28),
      amount: P(126_400),
      memo: `2nd half ${monthName(d(m, 1))}`,
      accountId: IDS.payroll,
    });
    addCheck({
      bankId: IDS.bdo,
      payee: "Meralco",
      vendorId: IDS.vendMeralco,
      issueDate: d(m, 22),
      postDate: d(m, 28),
      amount: P(power[m - 1]),
      memo: `${monthName(d(m, 1))} warehouse power`,
      accountId: IDS.utilities,
    });
  }

  addCheck({
    bankId: IDS.metro,
    payee: "Staff payroll",
    vendorId: IDS.vendPayroll,
    issueDate: d(12, 12),
    postDate: d(12, 15),
    amount: P(252_800),
    memo: "13th month pay (PD 851)",
    accountId: IDS.payroll,
  });

  for (let m = 1; m <= 12; m++) {
    addTransfer(d(m, 8), P(m >= 11 ? 280_000 : 255_000), IDS.bdo, IDS.metro, "Transfer Operating → Payroll");
  }
  addTransfer(d(12, 5), P(260_000), IDS.bdo, IDS.metro, "Transfer Operating → Payroll (13th month)");

  // Laguna Foods — monthly dry goods, Net 30. Paid ~22 days out when that date is before as-of.
  for (let m = 1; m <= 12; m++) {
    const date = d(m, 8);
    const dueDate = addDays(date, 30);
    const payDate = addDays(date, 22);
    addInvoice({
      customerId: IDS.custLaguna,
      date,
      dueDate,
      lines: [{ description: `Dry goods — ${monthName(date)} allocation`, quantity: 1, unitPrice: P(laguna[m - 1]) }],
      notes: "",
      paid:
        payDate < AS_OF
          ? [
              {
                date: payDate,
                amount: P(laguna[m - 1]),
                bankId: m % 3 === 2 ? IDS.bpi : IDS.bdo,
                method: m % 2 === 0 ? "check" : "cash",
                checkNumber: m % 2 === 0 ? String(1040 + m) : "",
              },
            ]
          : undefined,
    });
  }

  addInvoice({
    customerId: IDS.custCebu,
    date: d(2, 12),
    dueDate: d(2, 27),
    lines: [
      { description: "Marine fittings lot 8", quantity: 10, unitPrice: P(7_460) },
      { description: "Freight to Mandaue", quantity: 1, unitPrice: P(4_000) },
    ],
    notes: "",
    paid: [{ date: d(2, 28), amount: P(78_600), bankId: IDS.bdo, method: "check", checkNumber: "2188" }],
  });
  addInvoice({
    customerId: IDS.custCebu,
    date: d(4, 22),
    dueDate: d(5, 7),
    lines: [
      { description: "Marine fittings lot 11", quantity: 12, unitPrice: P(8_200) },
      { description: "Freight to Mandaue", quantity: 1, unitPrice: P(4_000) },
    ],
    notes: "",
    paid: [{ date: d(5, 6), amount: P(102_400), bankId: IDS.bdo, method: "card", checkNumber: "4412" }],
  });
  addInvoice({
    customerId: IDS.custCebu,
    date: d(6, 25),
    dueDate: d(7, 10),
    lines: [
      { description: "Marine fittings lot 13", quantity: 9, unitPrice: P(9_200) },
      { description: "Freight to Mandaue", quantity: 1, unitPrice: P(9_000) },
    ],
    notes: "",
    paid: [{ date: d(7, 9), amount: P(91_800), bankId: IDS.bpi, method: "check", checkNumber: "2204" }],
  });
  addInvoice({
    customerId: IDS.custCebu,
    date: d(8, 4),
    dueDate: d(8, 19),
    lines: [
      { description: "Marine fittings lot 14", quantity: 12, unitPrice: P(8_750) },
      { description: "Freight to Mandaue", quantity: 1, unitPrice: P(4_200) },
    ],
    notes: "Awaiting confirmation of berth schedule.",
  });
  addInvoice({
    customerId: IDS.custCebu,
    date: d(10, 8),
    dueDate: d(10, 23),
    lines: [
      { description: "Marine fittings lot 16 (booked)", quantity: 11, unitPrice: P(8_900) },
      { description: "Freight to Mandaue", quantity: 1, unitPrice: P(4_200) },
    ],
    notes: "October berth — confirmed.",
  });

  addInvoice({
    customerId: IDS.custMetro,
    date: d(1, 10),
    dueDate: d(2, 9),
    lines: [{ description: "Clinic supplies — Q1 retainer", quantity: 1, unitPrice: P(96_000) }],
    notes: "",
    paid: [{ date: d(2, 5), amount: P(96_000), bankId: IDS.bdo, method: "check", checkNumber: "3301" }],
  });
  addInvoice({
    customerId: IDS.custMetro,
    date: d(4, 10),
    dueDate: d(5, 10),
    lines: [{ description: "Clinic supplies — Q2 retainer", quantity: 1, unitPrice: P(96_000) }],
    notes: "",
    paid: [{ date: d(5, 8), amount: P(96_000), bankId: IDS.bdo, method: "check", checkNumber: "3308" }],
  });
  addInvoice({
    customerId: IDS.custMetro,
    date: d(7, 10),
    dueDate: d(8, 9),
    lines: [{ description: "Clinic supplies — Q3 retainer", quantity: 1, unitPrice: P(96_000) }],
    notes: "",
    paid: [{ date: d(8, 12), amount: P(96_000), bankId: IDS.bdo, method: "check", checkNumber: "3312" }],
  });
  addInvoice({
    customerId: IDS.custMetro,
    date: d(10, 10),
    dueDate: d(11, 9),
    lines: [{ description: "Clinic supplies — Q4 retainer", quantity: 1, unitPrice: P(96_000) }],
    notes: "Send to billing desk.",
  });

  addInvoice({
    customerId: IDS.custDavao,
    date: d(3, 20),
    dueDate: d(3, 20),
    lines: [
      { description: "Harvest crates (650 pcs)", quantity: 650, unitPrice: P(180) },
      { description: "Label printing", quantity: 1, unitPrice: P(7_500) },
    ],
    notes: "",
    paid: [
      { date: d(3, 20), amount: P(62_250), bankId: IDS.bpi, method: "cash" },
      { date: d(4, 10), amount: P(62_250), bankId: IDS.bpi, method: "check", checkNumber: "5510" },
    ],
  });
  addInvoice({
    customerId: IDS.custDavao,
    date: d(6, 18),
    dueDate: d(6, 18),
    lines: [
      { description: "Harvest crates (800 pcs)", quantity: 800, unitPrice: P(185) },
      { description: "Label printing", quantity: 1, unitPrice: P(8_000) }],
    notes: "",
    paid: [{ date: d(7, 8), amount: P(156_000), bankId: IDS.bpi, method: "check", checkNumber: "5522" }],
  });
  addInvoice({
    customerId: IDS.custDavao,
    date: d(8, 18),
    dueDate: d(9, 2),
    lines: [
      { description: "Harvest crates (500 pcs)", quantity: 500, unitPrice: P(185) },
      { description: "Label printing", quantity: 1, unitPrice: P(6_800) },
    ],
    notes: "50% deposit received.",
    paid: [{ date: d(8, 18), amount: P(49_650), bankId: IDS.bpi, method: "cash" }],
  });
  addInvoice({
    customerId: IDS.custDavao,
    date: d(11, 14),
    dueDate: d(11, 14),
    lines: [
      { description: "Harvest crates (720 pcs)", quantity: 720, unitPrice: P(190) },
      { description: "Label printing", quantity: 1, unitPrice: P(8_400) },
    ],
    notes: "Peak harvest window.",
  });

  addInvoice({
    customerId: IDS.custBatangas,
    date: d(3, 12),
    dueDate: d(4, 11),
    lines: [
      { description: "Insulated liners (200)", quantity: 200, unitPrice: P(420) },
      { description: "Reefer labels", quantity: 1, unitPrice: P(4_800) },
    ],
    notes: "",
    paid: [{ date: d(4, 4), amount: P(88_800), bankId: IDS.bdo, method: "check", checkNumber: "4419" }],
  });
  addInvoice({
    customerId: IDS.custBatangas,
    date: d(8, 14),
    dueDate: d(9, 13),
    lines: [{ description: "Cold-room film (August)", quantity: 1, unitPrice: P(74_500) }],
    notes: "Hold until Friday pickup.",
    paid: [{ date: d(8, 20), amount: P(30_000), bankId: IDS.bdo, method: "cash" }],
  });
  addInvoice({
    customerId: IDS.custIloilo,
    date: d(5, 6),
    dueDate: d(5, 21),
    lines: [{ description: "Dry goods pallet", quantity: 4, unitPrice: P(18_750) }],
    notes: "",
    paid: [{ date: d(5, 18), amount: P(75_000), bankId: IDS.bpi, method: "check", checkNumber: "5530" }],
  });
  addInvoice({
    customerId: IDS.custIloilo,
    date: d(8, 22),
    dueDate: d(9, 6),
    lines: [{ description: "Dry goods pallet", quantity: 3, unitPrice: P(19_200) }],
    notes: "Ro-ro via Batangas.",
  });
  addInvoice({
    customerId: IDS.custQuezon,
    date: d(6, 11),
    dueDate: d(7, 11),
    lines: [
      { description: "Bakery cartons (1,200)", quantity: 1200, unitPrice: P(42) },
      { description: "Tape cases", quantity: 8, unitPrice: P(680) },
    ],
    notes: "",
    paid: [{ date: d(6, 28), amount: P(28_000), bankId: IDS.bdo, method: "cash" }],
  });
  addInvoice({
    customerId: IDS.custSubic,
    date: d(7, 9),
    dueDate: d(8, 23),
    lines: [{ description: "Industrial fittings lot 9", quantity: 1, unitPrice: P(128_400) }],
    notes: "",
    paid: [{ date: d(8, 8), amount: P(128_400), bankId: IDS.bdo, method: "check", checkNumber: "4488" }],
  });
  addInvoice({
    customerId: IDS.custSubic,
    date: d(8, 26),
    dueDate: d(10, 10),
    lines: [{ description: "Industrial fittings lot 10 (booked)", quantity: 1, unitPrice: P(96_800) }],
    notes: "Freeport packing list attached.",
  });
  addInvoice({
    customerId: IDS.custSubic,
    date: d(4, 18),
    dueDate: d(5, 3),
    lines: [{ description: "Demurrage — still open", quantity: 1, unitPrice: P(48_600) }],
    notes: "Collections: called 20 May and 12 June. 90+ days as of close.",
  });

  addCashSale({
    date: d(1, 16),
    receivedFrom: "Harbor Point Counter",
    customerId: IDS.custHarbor,
    bankId: IDS.bdo,
    description: "Counter sale — dry goods",
    amount: P(9_800),
    memo: "Same-day cash.",
  });
  addCashSale({
    date: d(2, 21),
    receivedFrom: "Harbor Point Counter",
    customerId: IDS.custHarbor,
    bankId: IDS.bdo,
    description: "Counter sale — hardware",
    amount: P(11_200),
    memo: "Same-day cash.",
  });
  addCashSale({
    date: d(4, 18),
    receivedFrom: "Harbor Point Counter",
    customerId: IDS.custHarbor,
    bankId: IDS.safe,
    description: "Counter sale — tape and film",
    amount: P(8_450),
    memo: "Held in safekeeping.",
  });
  addCashSale({
    date: d(5, 27),
    receivedFrom: "Harbor Point Counter",
    customerId: IDS.custHarbor,
    bankId: IDS.bdo,
    description: "Counter sale — dry goods",
    amount: P(13_100),
    memo: "Same-day cash.",
  });
  addCashSale({
    date: d(7, 23),
    receivedFrom: "Harbor Point Counter",
    customerId: IDS.custHarbor,
    bankId: IDS.bdo,
    description: "Counter sale — mixed",
    amount: P(10_600),
    memo: "Same-day cash.",
  });
  addCashSale({
    date: d(8, 21),
    receivedFrom: "Harbor Point Counter",
    customerId: IDS.custHarbor,
    bankId: IDS.bdo,
    description: "Counter sale — dry goods",
    amount: P(12_400),
    memo: "Same-day cash.",
  });
  addCashSale({
    date: d(8, 27),
    receivedFrom: "Cebu Marine Supply",
    customerId: IDS.custCebu,
    bankId: IDS.safe,
    description: "Walk-up fittings",
    amount: P(8_750),
    method: "check",
    checkNumber: "2208",
    memo: "Paid at the counter.",
  });
  addCashSale({
    date: d(12, 19),
    receivedFrom: "Harbor Point Counter",
    customerId: IDS.custHarbor,
    bankId: IDS.bdo,
    description: "Christmas market counter",
    amount: P(24_800),
    memo: "Harbor Point Christmas market.",
  });

  addBill({
    vendorId: IDS.vendHarbor,
    date: d(2, 18),
    dueDate: d(3, 5),
    amount: P(14_200),
    accountId: IDS.opex,
    memo: "Cartons and tape — February",
    reference: "HP-7710",
    paid: { date: d(3, 3), bankId: IDS.bdo },
  });
  addBill({
    vendorId: IDS.vendHarbor,
    date: d(5, 20),
    dueDate: d(6, 4),
    amount: P(16_800),
    accountId: IDS.opex,
    memo: "Cartons and tape — May",
    reference: "HP-8022",
    paid: { date: d(6, 5), bankId: IDS.bdo },
  });
  addBill({
    vendorId: IDS.vendHarbor,
    date: d(7, 29),
    dueDate: d(8, 13),
    amount: P(15_400),
    accountId: IDS.opex,
    memo: "Cartons and tape — July",
    reference: "HP-8410",
    paid: { date: d(8, 14), bankId: IDS.bdo },
  });
  addBill({
    vendorId: IDS.vendHarbor,
    date: d(8, 24),
    dueDate: d(9, 5),
    amount: P(18_500),
    accountId: IDS.opex,
    memo: "Cartons and tape — August",
    reference: "HP-8841",
  });
  addBill({
    vendorId: IDS.vendHarbor,
    date: d(11, 18),
    dueDate: d(12, 3),
    amount: P(21_200),
    accountId: IDS.opex,
    memo: "Cartons and tape — peak harvest",
    reference: "HP-9104",
  });

  addBill({
    vendorId: IDS.vendSantos,
    date: d(3, 28),
    dueDate: d(4, 12),
    amount: P(22_000),
    accountId: IDS.fees,
    memo: "Q1 bookkeeping retainer",
    reference: "SC-Q1",
    paid: { date: d(4, 12), bankId: IDS.bdo },
  });
  addBill({
    vendorId: IDS.vendSantos,
    date: d(6, 27),
    dueDate: d(7, 12),
    amount: P(22_000),
    accountId: IDS.fees,
    memo: "Q2 bookkeeping retainer",
    reference: "SC-Q2",
    paid: { date: d(7, 11), bankId: IDS.bdo },
  });
  addBill({
    vendorId: IDS.vendSantos,
    date: d(8, 26),
    dueDate: d(9, 10),
    amount: P(22_000),
    accountId: IDS.fees,
    memo: "Q3 bookkeeping retainer",
    reference: "SC-Q3",
  });
  addBill({
    vendorId: IDS.vendSantos,
    date: d(11, 26),
    dueDate: d(12, 11),
    amount: P(28_000),
    accountId: IDS.fees,
    memo: "Q4 review + year-end pack",
    reference: "SC-Q4",
  });

  addBill({
    vendorId: IDS.vendDelta,
    date: d(3, 21),
    dueDate: d(4, 20),
    amount: P(18_400),
    accountId: IDS.opex,
    memo: "Southbound hauling — Davao March",
    reference: "DFL-310",
    paid: { date: d(4, 8), bankId: IDS.bpi },
  });
  addBill({
    vendorId: IDS.vendDelta,
    date: d(6, 19),
    dueDate: d(7, 19),
    amount: P(24_800),
    accountId: IDS.opex,
    memo: "Southbound hauling — Davao June",
    reference: "DFL-618",
    paid: { date: d(7, 9), bankId: IDS.bpi },
  });
  addBill({
    vendorId: IDS.vendDelta,
    date: d(8, 19),
    dueDate: d(9, 18),
    amount: P(22_150),
    accountId: IDS.opex,
    memo: "Southbound hauling — Davao August",
    reference: "DFL-818",
  });
  addBill({
    vendorId: IDS.vendDelta,
    date: d(11, 15),
    dueDate: d(12, 15),
    amount: P(26_400),
    accountId: IDS.opex,
    memo: "Southbound hauling — Davao November",
    reference: "DFL-1114",
  });
  addBill({
    vendorId: IDS.vendGlobe,
    date: d(7, 1),
    dueDate: d(7, 15),
    amount: P(4_890),
    accountId: IDS.utilities,
    memo: "Warehouse SIMs — July",
    reference: "GLO-071",
    paid: { date: d(7, 12), bankId: IDS.bdo },
  });
  addBill({
    vendorId: IDS.vendGlobe,
    date: d(8, 1),
    dueDate: d(8, 15),
    amount: P(4_890),
    accountId: IDS.utilities,
    memo: "Warehouse SIMs — August",
    reference: "GLO-081",
    paid: { date: d(8, 14), bankId: IDS.bdo },
  });
  addBill({
    vendorId: IDS.vendPetron,
    date: d(8, 5),
    dueDate: d(8, 20),
    amount: P(38_600),
    accountId: IDS.opex,
    memo: "Fleet card — August",
    reference: "PET-808",
    paid: { date: d(8, 18), bankId: IDS.bdo },
  });
  addBill({
    vendorId: IDS.vendPldt,
    date: d(8, 1),
    dueDate: d(8, 20),
    amount: P(6_450),
    accountId: IDS.utilities,
    memo: "Fiber — Harbor Point August",
    reference: "PLDT-0826",
    paid: { date: d(8, 19), bankId: IDS.bdo },
  });
  addBill({
    vendorId: IDS.vendVisao,
    date: d(8, 1),
    dueDate: d(8, 16),
    amount: P(28_000),
    accountId: IDS.opex,
    memo: "Night watch — August",
    reference: "VSA-0801",
  });
  addBill({
    vendorId: IDS.vendVisao,
    date: d(9, 1),
    dueDate: d(9, 16),
    amount: P(28_000),
    accountId: IDS.opex,
    memo: "Night watch — September",
    reference: "VSA-0901",
  });

  const extraCustomers = customers.filter((c) => c.id !== IDS.custHarbor);
  const extraVendors = vendors.filter((v) => v.id !== IDS.vendPayroll);
  const goods = [
    "Dry goods lot",
    "Marine fittings",
    "Industrial fittings",
    "Carton run",
    "Reefer packing",
    "Spare parts",
    "Film and tape",
    "Ice and salt",
  ];
  const billMemos = [
    "Office supplies",
    "Fleet fuel",
    "Freight outbound",
    "Last-mile delivery",
    "Water",
    "Internet",
    "Mall stall dues",
    "Cargo handling",
  ];
  const billAccounts = [IDS.opex, IDS.misc, IDS.fees, IDS.utilities];
  const cashMemos = [
    "Same-day cash.",
    "Counter walk-up.",
    "COD at the dock.",
    "Held in safekeeping.",
    "Paid at the counter.",
    "Spot sale — no terms.",
  ];

  /** Seasonal trade rhythm (PH warehouse): soft Jan, build mid-year, harvest/Christmas peak. Weights sum 126. */
  const SEASON = [7, 8, 9, 10, 11, 12, 12, 11, 10, 11, 13, 12];
  const SEASON_SUM = SEASON.reduce((a, b) => a + b, 0);
  function tradeMonth(i: number): number {
    let t = (i * 17 + 3) % SEASON_SUM;
    for (let m = 0; m < 12; m++) {
      t -= SEASON[m];
      if (t < 0) return m + 1;
    }
    return 12;
  }
  function tradeDay(i: number, salt: number): number {
    return 1 + ((i * 5 + salt) % 28);
  }

  // Early September activity already on the books (as-of is 3 Sep).
  addCashSale({
    date: d(9, 1),
    receivedFrom: "Harbor Point Counter",
    customerId: IDS.custHarbor,
    bankId: IDS.bdo,
    description: "Counter sale — dry goods",
    amount: P(11_600),
    memo: "Same-day cash.",
  });
  addCashSale({
    date: d(9, 2),
    receivedFrom: "Harbor Point Counter",
    customerId: IDS.custHarbor,
    bankId: IDS.bdo,
    description: "Counter sale — tape and film",
    amount: P(7_850),
    memo: "Same-day cash.",
  });
  addInvoice({
    customerId: IDS.custLaguna,
    date: d(9, 2),
    dueDate: d(10, 2),
    lines: [{ description: "Dry goods — early September top-up", quantity: 1, unitPrice: P(64_800) }],
    notes: "Posted before month-end allocation.",
  });
  addBill({
    vendorId: IDS.vendGlobe,
    date: d(9, 1),
    dueDate: d(9, 15),
    amount: P(4_890),
    accountId: IDS.utilities,
    memo: "Warehouse SIMs — September",
    reference: "GLO-091",
  });
  addBill({
    vendorId: IDS.vendPetron,
    date: d(9, 2),
    dueDate: d(9, 17),
    amount: P(31_200),
    accountId: IDS.opex,
    memo: "Fleet card — early September",
    reference: "PET-902",
  });

  // Extra trade across the full year (~800 source docs with core ops → ~1,000 total).
  for (let i = 0; i < 250; i++) {
    const month = tradeMonth(i);
    const day = tradeDay(i, 2);
    const cust = extraCustomers[i % extraCustomers.length];
    const qty = 1 + (i % 5);
    const unit = P(8_400 + (i % 48) * 720);
    const date = d(month, day);
    const dueDate = d(month, Math.min(28, day + 15));
    const paidOn = d(month, Math.min(28, day + 12));
    // Stronger mid-year / harvest ticket sizes
    const bump = month >= 10 || month === 6 || month === 7 ? 1.08 : month <= 2 ? 0.92 : 1;
    const adjUnit = Math.round(unit * bump);
    const adjTotal = qty * adjUnit;
    addInvoice({
      customerId: cust.id,
      date,
      dueDate,
      lines: [{ description: `${goods[i % goods.length]} — ${monthName(date)}`, quantity: qty, unitPrice: adjUnit }],
      notes: "",
      paid:
        paidOn <= AS_OF && i % 5 !== 0
          ? [
              {
                date: paidOn,
                amount: adjTotal,
                bankId: i % 4 === 0 ? IDS.bpi : IDS.bdo,
                method: i % 2 === 0 ? "check" : "cash",
                checkNumber: i % 2 === 0 ? String(5000 + i) : "",
              },
            ]
          : undefined,
    });
  }

  for (let i = 0; i < 265; i++) {
    const month = tradeMonth(i + 41);
    const day = tradeDay(i, 3);
    const vendor = extraVendors[i % extraVendors.length];
    const amount = P(4_200 + (i % 36) * 380);
    const payDate = d(month, Math.min(28, day + 10));
    addBill({
      vendorId: vendor.id,
      date: d(month, day),
      dueDate: d(month, Math.min(28, day + 14)),
      amount,
      accountId: billAccounts[i % billAccounts.length],
      memo: `${billMemos[i % billMemos.length]} — ${monthName(d(month, day))}`,
      reference: `X-${String(i + 1).padStart(4, "0")}`,
      paid: payDate <= AS_OF && i % 4 !== 0 ? { date: payDate, bankId: i % 3 === 0 ? IDS.bpi : IDS.bdo } : undefined,
    });
  }

  for (let i = 0; i < 130; i++) {
    const month = tradeMonth(i + 7);
    const day = tradeDay(i, 4);
    const cust = extraCustomers[(i * 3) % extraCustomers.length];
    addCashSale({
      date: d(month, day),
      receivedFrom: cust.name,
      customerId: cust.id,
      bankId: i % 7 === 0 ? IDS.safe : IDS.bdo,
      description: goods[(i + 2) % goods.length],
      amount: P(3_100 + (i % 20) * 290),
      memo: cashMemos[i % cashMemos.length],
    });
  }

  const fleetVendors = [IDS.vendPetron, IDS.vendPhoenix, IDS.vendLala, IDS.vendGlobe, IDS.vendJrs, IDS.vendWater, IDS.vendOffice];
  const fleetMemos = ["Fleet fuel", "Fleet fuel", "Last-mile delivery", "Mobile data", "Courier", "Water", "Office supplies"];
  for (let i = 0; i < 90; i++) {
    const month = tradeMonth(i + 13);
    const day = tradeDay(i, 6);
    const vendor = vendors.find((v) => v.id === fleetVendors[i % fleetVendors.length]);
    if (!vendor) continue;
    addCheck({
      bankId: i % 5 === 0 ? IDS.bpi : IDS.bdo,
      payee: vendor.name,
      vendorId: vendor.id,
      issueDate: d(month, day),
      postDate: d(month, Math.min(28, day + 3)),
      amount: P(2_800 + (i % 18) * 410),
      memo: `${fleetMemos[i % fleetMemos.length]} — ${monthName(d(month, day))}`,
      accountId: i % 3 === 0 ? IDS.utilities : IDS.opex,
    });
  }

  const budgetItems: BudgetItem[] = [
    { id: "bud-rent", name: "Warehouse rent", kind: "outflow", amount: P(85_000), cadence: "monthly", startMonth: "2026-01", accountId: IDS.rent },
    { id: "bud-pay", name: "Payroll", kind: "outflow", amount: P(252_800), cadence: "monthly", startMonth: "2026-01", accountId: IDS.payroll },
    { id: "bud-util", name: "Utilities", kind: "outflow", amount: P(19_500), cadence: "monthly", startMonth: "2026-01", accountId: IDS.utilities },
    { id: "bud-sales", name: "Trade sales", kind: "inflow", amount: P(420_000), cadence: "monthly", startMonth: "2026-01", accountId: IDS.sales },
  ];

  const recurrences: RecurringItem[] = [
    {
      id: "rec-rent",
      kind: "check",
      name: "Warehouse rent",
      vendorId: IDS.vendAyala,
      amount: P(85_000),
      bankId: IDS.bdo,
      accountId: IDS.rent,
      memo: "Monthly warehouse",
      dayOfMonth: 1,
      nextDate: "2026-09-01",
      active: true,
    },
    {
      id: "rec-pay1",
      kind: "check",
      name: "Payroll 1st half",
      vendorId: IDS.vendPayroll,
      amount: P(126_400),
      bankId: IDS.metro,
      accountId: IDS.payroll,
      memo: "Semi-monthly payroll",
      dayOfMonth: 13,
      nextDate: "2026-09-13",
      active: true,
    },
    {
      id: "rec-pay2",
      kind: "check",
      name: "Payroll 2nd half",
      vendorId: IDS.vendPayroll,
      amount: P(126_400),
      bankId: IDS.metro,
      accountId: IDS.payroll,
      memo: "Semi-monthly payroll",
      dayOfMonth: 27,
      nextDate: "2026-09-27",
      active: true,
    },
    {
      id: "rec-power",
      kind: "check",
      name: "Warehouse power",
      vendorId: IDS.vendMeralco,
      amount: P(19_500),
      bankId: IDS.bdo,
      accountId: IDS.utilities,
      memo: "Meralco",
      dayOfMonth: 22,
      nextDate: "2026-09-22",
      active: true,
    },
  ];

  return {
    settings: {
      ...DEFAULT_SETTINGS,
      companyName: "Pacific Harbor Trading",
      companyAddress: "Unit 12, Harbor Point, Las Piñas, Metro Manila\nTIN 009-774-221-000",
      companyPhone: "+63 2 8800 4410",
      companyEmail: "treasury@pacificharbor.ph",
    },
    banks,
    accounts: SYSTEM_ACCOUNTS,
    customers,
    vendors,
    employees: [
      {
        id: "emp-reyes",
        name: "Ana Reyes",
        title: "Office manager",
        email: "ana.reyes@pacificharbor.example",
        phone: "+63 917 555 0101",
        payType: "salary",
        rate: 4_500_000,
        bankId: IDS.metro,
        hireDate: "2024-03-01",
        active: true,
        notes: "Semi-monthly payroll",
        sortOrder: 0,
      },
      {
        id: "emp-santos",
        name: "Miguel Santos",
        title: "Warehouse lead",
        email: "miguel.santos@pacificharbor.example",
        phone: "+63 917 555 0102",
        payType: "salary",
        rate: 3_800_000,
        bankId: IDS.metro,
        hireDate: "2023-11-15",
        active: true,
        notes: "",
        sortOrder: 1,
      },
      {
        id: "emp-cruz",
        name: "Liza Cruz",
        title: "Bookkeeper",
        email: "liza.cruz@pacificharbor.example",
        phone: "+63 917 555 0103",
        payType: "hourly",
        rate: 35_000,
        bankId: IDS.metro,
        hireDate: "2025-01-10",
        active: true,
        notes: "Part-time, about 80 hours a month",
        sortOrder: 2,
      },
    ],
    invoices,
    bills,
    receipts,
    checks,
    journals,
    budgetItems,
    recurrences,
    reconHistory: [],
    closeHistory: [],
    audit: [],
    nextNumbers: {
      invoice: invoiceN,
      check: checkNext,
      receipt: receiptN,
      bill: billN,
    },
  };
}
