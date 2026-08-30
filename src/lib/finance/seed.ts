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
  Vendor,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";

const IDS = {
  bdo: "bank-bdo",
  bpi: "bank-bpi",
  metro: "bank-metro",
  safe: "bank-safe",
  cashBdo: "acct-1000",
  cashBpi: "acct-1010",
  cashMetro: "acct-1020",
  cashSafe: "acct-1030",
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
  vendAyala: "vend-ayala",
  vendMeralco: "vend-meralco",
  vendSantos: "vend-santos",
  vendDelta: "vend-delta",
  vendHarbor: "vend-harbor",
};

export const SYSTEM_ACCOUNTS: Account[] = [
  { id: IDS.cashBdo, code: "1000", name: "Cash — BDO Checking", type: "asset", bankId: IDS.bdo, system: true },
  { id: IDS.cashBpi, code: "1010", name: "Cash — BPI Savings", type: "asset", bankId: IDS.bpi, system: true },
  { id: IDS.cashMetro, code: "1020", name: "Cash — Metrobank Payroll", type: "asset", bankId: IDS.metro, system: true },
  { id: IDS.cashSafe, code: "1030", name: "Cash — Safekeeping", type: "asset", bankId: IDS.safe, system: true },
  { id: IDS.ar, code: "1200", name: "Accounts Receivable", type: "asset", system: true },
  { id: IDS.ap, code: "2000", name: "Accounts Payable", type: "liability", system: true },
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

/** Sample books are a live 2026 year as of this date. */
const AS_OF = "2026-08-30";

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

export function emptyBooks(): FinanceData {
  return {
    settings: { ...DEFAULT_SETTINGS },
    banks: [],
    accounts: SYSTEM_ACCOUNTS.filter((a) => !a.bankId),
    customers: [],
    vendors: [],
    invoices: [],
    bills: [],
    receipts: [],
    checks: [],
    journals: [],
    budgetItems: [],
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
    },
    {
      id: IDS.bpi,
      name: "Bank of the Philippine Islands",
      nickname: "Reserve",
      accountNumber: "•••• 1190",
      openingBalance: P(486_250),
      accountId: IDS.cashBpi,
      archived: false,
    },
    {
      id: IDS.metro,
      name: "Metrobank",
      nickname: "Payroll",
      accountNumber: "•••• 7734",
      openingBalance: P(380_000),
      accountId: IDS.cashMetro,
      archived: false,
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
      notes: "Preferred delivery Tuesday mornings.",
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
  ];

  const journals: JournalEntry[] = [];
  const invoices: Invoice[] = [];
  const bills: Bill[] = [];
  const receipts: Receipt[] = [];
  const checks: CheckRecord[] = [];
  const checkNext: Record<string, number> = { [IDS.bdo]: 4401, [IDS.bpi]: 2201, [IDS.metro]: 1101, [IDS.safe]: 1 };
  let invoiceN = 1;
  let receiptN = 1;
  let billN = 1;

  function post(input: Parameters<typeof makeJournal>[0], id: string): JournalEntry {
    const entry = { ...makeJournal(input), id };
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
      payee: "Ayala Land — Warehouse rent",
      vendorId: IDS.vendAyala,
      issueDate: d(m, 1),
      postDate: d(m, 5),
      amount: P(85_000),
      memo: `${monthName(d(m, 1))} warehouse`,
      accountId: IDS.rent,
    });
    addCheck({
      bankId: IDS.metro,
      payee: `Staff payroll — 1st half ${monthName(d(m, 1))}`,
      issueDate: d(m, 13),
      postDate: d(m, 14),
      amount: P(126_400),
      memo: "Semi-monthly payroll",
      accountId: IDS.payroll,
    });
    addCheck({
      bankId: IDS.metro,
      payee: `Staff payroll — 2nd half ${monthName(d(m, 1))}`,
      issueDate: d(m, 27),
      postDate: d(m, 28),
      amount: P(126_400),
      memo: "Semi-monthly payroll",
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
    payee: "Staff payroll — 13th month",
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

  addCashSale({
    date: d(1, 16),
    receivedFrom: "Walk-in — Harbor stall",
    bankId: IDS.bdo,
    description: "Counter sale — dry goods",
    amount: P(9_800),
    memo: "Same-day cash.",
  });
  addCashSale({
    date: d(2, 21),
    receivedFrom: "Walk-in — Harbor stall",
    bankId: IDS.bdo,
    description: "Counter sale — hardware",
    amount: P(11_200),
    memo: "Same-day cash.",
  });
  addCashSale({
    date: d(4, 18),
    receivedFrom: "Walk-in — Harbor stall",
    bankId: IDS.safe,
    description: "Counter sale — tape and film",
    amount: P(8_450),
    memo: "Held in safekeeping.",
  });
  addCashSale({
    date: d(5, 27),
    receivedFrom: "Walk-in — Harbor stall",
    bankId: IDS.bdo,
    description: "Counter sale — dry goods",
    amount: P(13_100),
    memo: "Same-day cash.",
  });
  addCashSale({
    date: d(7, 23),
    receivedFrom: "Walk-in — Harbor stall",
    bankId: IDS.bdo,
    description: "Counter sale — mixed",
    amount: P(10_600),
    memo: "Same-day cash.",
  });
  addCashSale({
    date: d(8, 21),
    receivedFrom: "Walk-in — Harbor stall",
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
    receivedFrom: "Walk-in — Christmas bazaar",
    bankId: IDS.bdo,
    description: "Bazaar counter sale",
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

  const budgetItems: BudgetItem[] = [
    { id: "bud-rent", name: "Warehouse rent", kind: "outflow", amount: P(85_000), cadence: "monthly", startMonth: "2026-01", accountId: IDS.rent },
    { id: "bud-pay", name: "Payroll", kind: "outflow", amount: P(252_800), cadence: "monthly", startMonth: "2026-01", accountId: IDS.payroll },
    { id: "bud-util", name: "Utilities", kind: "outflow", amount: P(19_500), cadence: "monthly", startMonth: "2026-01", accountId: IDS.utilities },
    { id: "bud-sales", name: "Trade sales", kind: "inflow", amount: P(420_000), cadence: "monthly", startMonth: "2026-01", accountId: IDS.sales },
  ];

  return {
    settings: {
      ...DEFAULT_SETTINGS,
      companyName: "Pacific Harbor Trading",
      companyAddress: "Unit 12, Harbor Point, Las Piñas, Metro Manila",
      companyPhone: "+63 2 8800 4410",
      companyEmail: "treasury@pacificharbor.ph",
    },
    banks,
    accounts: SYSTEM_ACCOUNTS,
    customers,
    vendors,
    invoices,
    bills,
    receipts,
    checks,
    journals,
    budgetItems,
    nextNumbers: {
      invoice: invoiceN,
      check: checkNext,
      receipt: receiptN,
      bill: billN,
    },
  };
}
