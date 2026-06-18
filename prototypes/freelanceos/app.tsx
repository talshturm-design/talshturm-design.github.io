import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  PanelLeft,
  Plus,
  Link2,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Bell,
  Send,
  FileText,
  GitMerge,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Wallet,
  Banknote,
  Eye,
  ShieldCheck,
  X,
  Download,
  Mail,
  MessageSquare,
  MessageCircle,
  Slack,
  Check,
  Paperclip,
  Sparkle,
  Users,
  FolderKanban,
  ChartColumnIncreasing,
  ChartPie,
  Receipt,
  Landmark,
  Eclipse,
  Settings,
  Waypoints,
  CircleDashed,
} from "lucide-react";

/* ---- shadcn sidebar inject ---- */

/* ============================================================
   wipOS — Earnings
   A calm financial control center for freelancers.
   Palette of meaning:
     green  = paid / healthy
     amber  = due soon / attention
     red    = overdue / risk
     purple = expected / forecast
   ============================================================ */

/* ---------------------------- helpers ---------------------------- */

const money = (n: number): string =>
  "$" + Math.round(n).toLocaleString("en-US");

const moneyK = (n: number): string =>
  n >= 1000 ? "$" + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k" : "$" + n;

type ThemeMode = "light" | "dark";

const ThemeCtx = React.createContext<{ theme: ThemeMode; toggleTheme: () => void }>({
  theme: "light",
  toggleTheme: () => {},
});

const useTheme = () => React.useContext(ThemeCtx);

const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [theme, setTheme] = React.useState<ThemeMode>(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-changing");
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("wipos-theme", theme);
    const timer = window.setTimeout(() => root.classList.remove("theme-changing"), 280);
    return () => window.clearTimeout(timer);
  }, [theme]);

  const toggleTheme = React.useCallback(() => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }, []);

  return <ThemeCtx.Provider value={{ theme, toggleTheme }}>{children}</ThemeCtx.Provider>;
};

type Tone = "green" | "amber" | "red" | "purple" | "slate";

const TONE: Record<
  Tone,
  { text: string; bg: string; ring: string; dot: string; solid: string }
> = {
  green: { text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/15", ring: "ring-emerald-600/15 dark:ring-emerald-500/20", dot: "bg-emerald-500", solid: "#10b981" },
  amber: { text: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/15", ring: "ring-amber-600/15 dark:ring-amber-500/20", dot: "bg-amber-500", solid: "#f59e0b" },
  red:   { text: "text-rose-700 dark:text-rose-400",  bg: "bg-rose-50 dark:bg-rose-500/15",  ring: "ring-rose-600/15 dark:ring-rose-500/20",  dot: "bg-rose-500",  solid: "#f43f5e" },
  purple: { text: "text-violet-700 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/15", ring: "ring-violet-600/15 dark:ring-violet-500/20", dot: "bg-violet-500", solid: "#8b5cf6" },
  slate: { text: "text-neutral-600 dark:text-neutral-400", bg: "bg-neutral-100 dark:bg-neutral-500/15", ring: "ring-neutral-500/15 dark:ring-neutral-500/20", dot: "bg-neutral-400", solid: "#a3a3a3" },
};

/* ---------------------------- mock data ---------------------------- */

const KPIS = [
  {
    label: "Paid this month",
    value: 18420,
    context: "+12% vs last month",
    tone: "green" as Tone,
  },
  {
    label: "Expected by month-end",
    value: 27850,
    context: "$9,430 still expected",
    tone: "purple" as Tone,
  },
  {
    label: "Overdue",
    value: 4300,
    context: "2 invoices require follow-up",
    tone: "red" as Tone,
  },
  {
    label: "Year-to-date earnings",
    value: 146200,
    context: "72% of annual goal",
    tone: "slate" as Tone,
  },
];

const CHART_ALL = [
  { month: "Jul", paid: 12800, expected: 5200, overdue: 800 },
  { month: "Aug", paid: 13500, expected: 6100, overdue: 1100 },
  { month: "Sep", paid: 14900, expected: 5400, overdue: 900 },
  { month: "Oct", paid: 15200, expected: 6800, overdue: 1300 },
  { month: "Nov", paid: 14600, expected: 7200, overdue: 1600 },
  { month: "Dec", paid: 13800, expected: 5900, overdue: 1400 },
  { month: "Jan", paid: 14200, expected: 6000, overdue: 1200 },
  { month: "Feb", paid: 15800, expected: 7000, overdue: 900 },
  { month: "Mar", paid: 16100, expected: 5800, overdue: 2100 },
  { month: "Apr", paid: 17400, expected: 8200, overdue: 1500 },
  { month: "May", paid: 16900, expected: 9100, overdue: 2400 },
  { month: "Jun", paid: 18420, expected: 9430, overdue: 4300 },
];

type ChartRange = 3 | 6 | 12;

const CHART_RANGE_TABS: { label: string; months: ChartRange }[] = [
  { label: "Last 3 months", months: 3 },
  { label: "Last 6 months", months: 6 },
  { label: "Last 12 months", months: 12 },
];

const chartSlice = (months: ChartRange) => CHART_ALL.slice(-months);

const buildOnTrackInsight = (months: ChartRange) => {
  const data = chartSlice(months);
  const current = data[data.length - 1];
  const prior = data.slice(0, -1);
  const currentForecast = current.paid + current.expected;
  const avgPrior = prior.reduce((sum, m) => sum + m.paid + m.expected, 0) / prior.length;
  const pct = Math.round(((currentForecast - avgPrior) / avgPrior) * 100);
  return {
    month: current.month,
    pct: Math.abs(pct),
    above: pct >= 0,
    overdue: current.overdue,
    months,
  };
};

type PaymentStatus = "due" | "expected" | "overdue" | "paid";

interface Payment {
  client: string;
  invoice: string;
  amount: number;
  due: string;
  status: PaymentStatus;
  action?: { label: string; icon: React.ComponentType<{ size?: number; className?: string }> };
}

const PIPELINE: {
  key: string;
  title: string;
  tone: Tone;
  items: Payment[];
}[] = [
  {
    key: "overdue",
    title: "Overdue",
    tone: "red",
    items: [
      { client: "Bluebird Studio", invoice: "INV-1041", amount: 1900, due: "Overdue 12 days", status: "overdue", action: { label: "Send reminder", icon: Send } },
      { client: "Bluebird Studio", invoice: "INV-1039", amount: 2400, due: "Overdue 21 days", status: "overdue", action: { label: "Send reminder", icon: Send } },
    ],
  },
  {
    key: "due",
    title: "Due this week",
    tone: "amber",
    items: [
      { client: "Northstar Labs", invoice: "INV-1048", amount: 2400, due: "Due tomorrow", status: "due", action: { label: "View", icon: Eye } },
      { client: "Vertex Co.", invoice: "INV-1050", amount: 1250, due: "Due in 3 days", status: "due", action: { label: "View", icon: Eye } },
    ],
  },
  {
    key: "expected",
    title: "Expected later",
    tone: "purple",
    items: [
      { client: "Orbit AI", invoice: "INV-1052", amount: 3800, due: "Expected Jun 28", status: "expected", action: { label: "View", icon: Eye } },
      { client: "Northstar Labs", invoice: "INV-1055", amount: 2400, due: "Expected Jul 2", status: "expected", action: { label: "View", icon: Eye } },
    ],
  },
  {
    key: "paid",
    title: "Recently paid",
    tone: "green",
    items: [
      { client: "Atlas Creative", invoice: "INV-1037", amount: 2750, due: "Paid yesterday", status: "paid", action: { label: "View", icon: Eye } },
      { client: "Northstar Labs", invoice: "INV-1033", amount: 4200, due: "Paid 3 days ago", status: "paid", action: { label: "View", icon: Eye } },
    ],
  },
];

interface Attention {
  text: React.ReactNode;
  action: string;
  tone: Tone;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  invoiceId?: string;
  reminder?: ReminderTarget;
}

const ATTENTION: Attention[] = [
  {
    text: (<><b className="font-semibold text-ink">Bluebird Studio</b> is 12 days late on INV-1041</>),
    action: "Send reminder",
    tone: "red",
    icon: AlertTriangle,
    reminder: { client: "Bluebird Studio", invoice: "INV-1041", amount: 1900, statusLabel: "Overdue 12 days", status: "overdue" },
  },
  {
    text: (<><b className="font-semibold text-ink">Northstar Labs</b> payment is due tomorrow</>),
    action: "View invoice",
    tone: "amber",
    icon: Clock,
    invoiceId: "INV-1048",
  },
  {
    text: (<><b className="font-semibold text-ink">$2,750</b> from Atlas Creative was received</>),
    action: "Match to invoice",
    tone: "green",
    icon: CheckCircle2,
  },
  {
    text: (<><b className="font-semibold text-ink">Orbit AI</b> usually pays 6 days late</>),
    action: "Adjust forecast",
    tone: "purple",
    icon: TrendingUp,
  },
];

type Reliability = "Reliable" | "Usually late" | "At risk" | "New client";

const RELIABILITY_TONE: Record<Reliability, Tone> = {
  "Reliable": "green",
  "Usually late": "amber",
  "At risk": "red",
  "New client": "purple",
};

interface Client {
  name: string;
  revenue: number;
  avgDays: number;
  reliability: Reliability;
  insight: string;
}

const CLIENTS: Client[] = [
  {
    name: "Northstar Labs",
    revenue: 42600,
    avgDays: 4,
    reliability: "Reliable",
    insight: "Pays within terms on 92% of invoices",
  },
  {
    name: "Orbit AI",
    revenue: 31200,
    avgDays: 9,
    reliability: "Usually late",
    insight: "Typically pays 6 days late · forecast adjusted",
  },
  {
    name: "Bluebird Studio",
    revenue: 22400,
    avgDays: 18,
    reliability: "At risk",
    insight: "$4.3k overdue · follow-up recommended",
  },
  {
    name: "Atlas Creative",
    revenue: 19700,
    avgDays: 3,
    reliability: "Reliable",
    insight: "Fastest payer in your roster",
  },
];

const INITIAL_CLIENT_NOTES: Record<string, string> = {
  "Northstar Labs": "Monthly retainer — keep on priority list",
  "Orbit AI": "Finance contact prefers Slack reminders",
  "Bluebird Studio": "Chasing INV-1041 this week",
};

const ACTIVITY: { text: React.ReactNode; time: string; tone: Tone; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { text: (<>Payment detected via <b className="font-medium text-ink">Wise</b> from Atlas Creative</>), time: "Yesterday, 4:12 PM", tone: "green", icon: Wallet },
  { text: (<><b className="font-medium text-ink">Bluebird Studio</b> replied on WhatsApp to your reminder</>), time: "Yesterday, 11:48 AM", tone: "slate", icon: MessageCircle },
  { text: (<>Invoice <b className="font-medium text-ink">INV-1052</b> sent to Orbit AI</>), time: "Jun 14, 2:30 PM", tone: "purple", icon: FileText },
  { text: (<><b className="font-medium text-ink">Orbit AI</b> replied in Slack about INV-1052</>), time: "Jun 14, 4:05 PM", tone: "slate", icon: Slack },
  { text: (<><b className="font-medium text-ink">Northstar Labs</b> viewed invoice</>), time: "Jun 13, 6:48 PM", tone: "slate", icon: Eye },
  { text: (<>Payment matched to <b className="font-medium text-ink">INV-1037</b> via Stripe</>), time: "Jun 13, 4:12 PM", tone: "green", icon: GitMerge },
  { text: (<><b className="font-medium text-ink">Northstar Labs</b> replied by email about INV-1055</>), time: "Jun 13, 3:20 PM", tone: "slate", icon: Mail },
  { text: (<>Invoice <b className="font-medium text-ink">INV-1048</b> due tomorrow</>), time: "Jun 13, 10:00 AM", tone: "amber", icon: Clock },
  { text: (<>Overdue alert for <b className="font-medium text-ink">Bluebird Studio</b></>), time: "Jun 12, 9:00 AM", tone: "red", icon: AlertTriangle },
  { text: (<>Payment detected via <b className="font-medium text-ink">PayPal</b> from Northstar Labs</>), time: "Jun 11, 11:20 AM", tone: "green", icon: Banknote },
];

/* ---------------------------- invoices ---------------------------- */

const FREELANCER = {
  name: "Jordan Ellis",
  role: "Product & Brand Design",
  email: "jordan@ellis.studio",
};

const STATUS_TONE: Record<PaymentStatus, Tone> = {
  due: "amber",
  expected: "purple",
  overdue: "red",
  paid: "green",
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  due: "Due soon",
  expected: "Expected",
  overdue: "Overdue",
  paid: "Paid",
};

interface InvoiceLine {
  desc: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  client: string;
  clientEmail: string;
  status: PaymentStatus;
  issued: string;
  dueDate: string;
  dueLabel: string;
  paidDate?: string;
  amount: number;
  paymentMethod: string;
  terms: string;
  lines: InvoiceLine[];
  note: string;
}

const INVOICES: Record<string, Invoice> = {
  "INV-1048": {
    id: "INV-1048",
    client: "Northstar Labs",
    clientEmail: "billing@northstarlabs.com",
    status: "due",
    issued: "Jun 1, 2026",
    dueDate: "Jun 17, 2026",
    dueLabel: "Due tomorrow",
    amount: 2400,
    paymentMethod: "Bank transfer",
    terms: "Net 14",
    lines: [
      { desc: "Design system maintenance", qty: 12, unit: "hrs", rate: 150, amount: 1800 },
      { desc: "Component library updates", qty: 4, unit: "hrs", rate: 150, amount: 600 },
    ],
    note: "Payment terms: Net 14 · Bank transfer",
  },
  "INV-1050": {
    id: "INV-1050",
    client: "Vertex Co.",
    clientEmail: "ap@vertex.co",
    status: "due",
    issued: "Jun 5, 2026",
    dueDate: "Jun 19, 2026",
    dueLabel: "Due in 3 days",
    amount: 1250,
    paymentMethod: "PayPal",
    terms: "Net 14",
    lines: [
      { desc: "Marketing landing page — UX", qty: 5, unit: "hrs", rate: 150, amount: 750 },
      { desc: "Prototype revisions", qty: 4, unit: "hrs", rate: 125, amount: 500 },
    ],
    note: "Payment terms: Net 14 · Bank transfer",
  },
  "INV-1052": {
    id: "INV-1052",
    client: "Orbit AI",
    clientEmail: "finance@orbit.ai",
    status: "expected",
    issued: "Jun 10, 2026",
    dueDate: "Jun 28, 2026",
    dueLabel: "Expected Jun 28",
    amount: 3800,
    paymentMethod: "Bank transfer",
    terms: "Net 21",
    lines: [
      { desc: "Brand identity sprint", qty: 1, unit: "project", rate: 2800, amount: 2800 },
      { desc: "Marketing site mockups", qty: 1, unit: "project", rate: 1000, amount: 1000 },
    ],
    note: "Payment terms: Net 21 · Bank transfer",
  },
  "INV-1055": {
    id: "INV-1055",
    client: "Northstar Labs",
    clientEmail: "billing@northstarlabs.com",
    status: "expected",
    issued: "Jun 28, 2026",
    dueDate: "Jul 2, 2026",
    dueLabel: "Expected Jul 2",
    amount: 2400,
    paymentMethod: "PayPal",
    terms: "Net 14",
    lines: [
      { desc: "Product design retainer — July", qty: 1, unit: "month", rate: 2400, amount: 2400 },
    ],
    note: "Recurring monthly retainer · Net 14 · PayPal",
  },
  "INV-1037": {
    id: "INV-1037",
    client: "Atlas Creative",
    clientEmail: "hello@atlascreative.co",
    status: "paid",
    issued: "Jun 2, 2026",
    dueDate: "Jun 16, 2026",
    dueLabel: "Paid yesterday",
    paidDate: "Jun 16, 2026",
    amount: 2750,
    paymentMethod: "Bank transfer",
    terms: "Net 14",
    lines: [
      { desc: "Website redesign — Phase 2", qty: 1, unit: "project", rate: 2000, amount: 2000 },
      { desc: "Responsive QA & handoff", qty: 5, unit: "hrs", rate: 150, amount: 750 },
    ],
    note: "Paid in full · Bank transfer",
  },
  "INV-1033": {
    id: "INV-1033",
    client: "Northstar Labs",
    clientEmail: "billing@northstarlabs.com",
    status: "paid",
    issued: "May 28, 2026",
    dueDate: "Jun 11, 2026",
    dueLabel: "Paid 3 days ago",
    paidDate: "Jun 14, 2026",
    amount: 4200,
    paymentMethod: "Bank transfer",
    terms: "Net 14",
    lines: [
      { desc: "Design system retainer — May", qty: 1, unit: "month", rate: 2400, amount: 2400 },
      { desc: "Mobile app screens", qty: 12, unit: "hrs", rate: 150, amount: 1800 },
    ],
    note: "Paid in full · Bank transfer",
  },
  "INV-1041": {
    id: "INV-1041",
    client: "Bluebird Studio",
    clientEmail: "accounts@bluebird.studio",
    status: "overdue",
    issued: "May 22, 2026",
    dueDate: "Jun 5, 2026",
    dueLabel: "Overdue 12 days",
    amount: 1900,
    paymentMethod: "Bank transfer",
    terms: "Net 14",
    lines: [
      { desc: "Marketing campaign design", qty: 1, unit: "project", rate: 1400, amount: 1400 },
      { desc: "Asset revisions", qty: 5, unit: "hrs", rate: 100, amount: 500 },
    ],
    note: "Payment terms: Net 14 · Bank transfer",
  },
  "INV-1039": {
    id: "INV-1039",
    client: "Bluebird Studio",
    clientEmail: "accounts@bluebird.studio",
    status: "overdue",
    issued: "May 6, 2026",
    dueDate: "June 2, 2026",
    dueLabel: "Overdue 21 days",
    amount: 2400,
    paymentMethod: "Bank transfer",
    terms: "Net 14",
    lines: [
      { desc: "Website refresh — design", qty: 1, unit: "project", rate: 1800, amount: 1800 },
      { desc: "Illustration set", qty: 6, unit: "hrs", rate: 100, amount: 600 },
    ],
    note: "Payment terms: Net 14 · Bank transfer",
  },
};

const STATUS_ORDER: Record<PaymentStatus, number> = { overdue: 0, due: 1, expected: 2, paid: 3 };

const INVOICE_LIST = Object.values(INVOICES).sort(
  (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.amount - a.amount
);

const clientInvoices = (name: string): Invoice[] =>
  Object.values(INVOICES).filter((inv) => inv.client === name);

const clientInvoiceSubtitle = (name: string): string => {
  const invoices = clientInvoices(name);
  if (invoices.length === 1) return invoices[0].id;
  return `${invoices.length} invoices`;
};

const clientOverdueTotal = (name: string): number =>
  clientInvoices(name)
    .filter((inv) => inv.status === "overdue")
    .reduce((s, inv) => s + inv.amount, 0);

const InvoiceCtx = React.createContext<(id: string) => void>(() => {});
const useOpenInvoice = () => React.useContext(InvoiceCtx);

/* ---------------------------- reminders ---------------------------- */

interface Contact {
  email: string;
  phone: string;
  whatsapp: string;
  slack: string;
  last: Record<string, Date>;
}

// Mock "last communication" timestamps, relative to today.
const _today = new Date();
const at = (daysAgo: number, h: number, m: number): Date => {
  const d = new Date(_today);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d;
};

const CONTACTS: Record<string, Contact> = {
  "Bluebird Studio": { email: "accounts@bluebird.studio", phone: "+1 (415) 555-0137", whatsapp: "+1 (415) 555-0137", slack: "#bluebird-billing", last: { email: at(0, 9, 12), sms: at(1, 16, 30), whatsapp: at(2, 11, 5), slack: at(8, 10, 0) } },
  "Northstar Labs": { email: "billing@northstarlabs.com", phone: "+1 (212) 555-0148", whatsapp: "+1 (212) 555-0148", slack: "#northstar-finance", last: { email: at(0, 8, 40), sms: at(4, 15, 0), whatsapp: at(1, 17, 20), slack: at(0, 10, 15) } },
  "Orbit AI": { email: "finance@orbit.ai", phone: "+1 (650) 555-0119", whatsapp: "+1 (650) 555-0119", slack: "#orbit-billing", last: { email: at(2, 13, 0), sms: at(6, 9, 30), whatsapp: at(0, 13, 5), slack: at(1, 11, 0) } },
  "Atlas Creative": { email: "hello@atlascreative.co", phone: "+1 (305) 555-0173", whatsapp: "+1 (305) 555-0173", slack: "#atlas-ap", last: { email: at(1, 10, 0), sms: at(5, 14, 0), whatsapp: at(3, 9, 0), slack: at(0, 11, 30) } },
  "Vertex Co.": { email: "ap@vertex.co", phone: "+1 (206) 555-0188", whatsapp: "+1 (206) 555-0188", slack: "#vertex-billing", last: { email: at(0, 9, 50), sms: at(1, 16, 0), whatsapp: at(7, 12, 0), slack: at(2, 10, 0) } },
};

const getContact = (client: string): Contact =>
  CONTACTS[client] || {
    email: "billing@" + client.toLowerCase().replace(/[^a-z]+/g, "") + ".com",
    phone: "+1 (000) 555-0100",
    whatsapp: "+1 (000) 555-0100",
    slack: "#billing",
    last: { email: at(2, 10, 0), sms: at(5, 12, 0), whatsapp: at(1, 14, 0), slack: at(9, 9, 0) },
  };

// Same day → exact time; 1 day → "Yesterday"; 2–3 days → "N days ago"; else date.
const formatLastComm = (d?: Date): string => {
  if (!d) return "No history";
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.round((startOf(new Date()) - startOf(d)) / 86400000);
  if (dayDiff <= 0) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff <= 3) return `${dayDiff} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

interface Channel {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  hint: string;
  get: (c: Contact) => string;
}

const CHANNELS: Channel[] = [
  { key: "email", label: "Email", icon: Mail, hint: "Business inbox", get: (c) => c.email },
  { key: "slack", label: "Slack", icon: Slack, hint: "Slack Connect", get: (c) => c.slack },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, hint: "Messaging", get: (c) => c.whatsapp },
  { key: "sms", label: "SMS", icon: MessageSquare, hint: "Text message", get: (c) => c.phone },
];

const getChannel = (key: string): Channel | undefined => CHANNELS.find((c) => c.key === key);

const INVOICE_REMINDERS: Partial<Record<string, { channel: string; at: Date }>> = {
  "INV-1039": { channel: "email", at: at(5, 14, 0) },
  "INV-1041": { channel: "email", at: at(1, 9, 2) },
  "INV-1052": { channel: "slack", at: at(1, 11, 0) },
  "INV-1037": { channel: "email", at: at(3, 16, 0) },
  "INV-1033": { channel: "email", at: at(8, 10, 30) },
};

const getQuickChannel = (contact: Contact): string => {
  let best = CHANNELS[0].key;
  let bestTime = contact.last[best]?.getTime() ?? 0;
  for (const ch of CHANNELS) {
    const t = contact.last[ch.key]?.getTime() ?? 0;
    if (t >= bestTime) {
      bestTime = t;
      best = ch.key;
    }
  }
  return best;
};

interface ReminderTarget {
  client: string;
  invoice: string;
  amount: number;
  statusLabel: string;
  status: PaymentStatus;
}

const buildMessage = (t: ReminderTarget, voice: string): string => {
  const ref = `invoice ${t.invoice} (${money(t.amount)})`;
  const state = t.statusLabel.toLowerCase();
  if (voice === "Friendly")
    return `Hi ${t.client} team,\n\nA gentle nudge that ${ref} is ${state}. Could you let me know when to expect payment?\n\nThanks so much,\n${FREELANCER.name}`;
  if (voice === "Firm")
    return `Hi ${t.client} team,\n\n${ref.charAt(0).toUpperCase() + ref.slice(1)} is ${state}. Please arrange payment within our agreed timeframe so we can keep the account in good standing.\n\nBest,\n${FREELANCER.name}`;
  return `Hi ${t.client} team,\n\nThis is a reminder that ${ref} is ${state}. Please arrange payment at your earliest convenience.\n\nBest,\n${FREELANCER.name}`;
};

interface SentReminder {
  target: ReminderTarget;
  channel: string;
  voice: string;
  message: string;
  subject: string;
  includeLink: boolean;
  attachPdf: boolean;
  copyMe: boolean;
  agentSent?: boolean;
}

const AGENT_SENT_INVOICES = new Set(["INV-1052", "INV-1041", "INV-1039"]);

const invoicePayUrl = (invoiceId: string) => `https://pay.wipos.app/i/${invoiceId}`;

const channelAttachesPdf = (channel: string) =>
  channel === "email" || channel === "slack" || channel === "whatsapp" || channel === "sms";

const MODAL_LINK = "font-medium text-blue-600 hover:underline dark:text-blue-400";

const ReminderMessageBody: React.FC<{
  message: string;
  invoiceId: string;
  channel: string;
  includeLink: boolean;
  attachPdf?: boolean;
}> = ({ message, invoiceId, channel, includeLink, attachPdf = false }) => {
  const url = invoicePayUrl(invoiceId);
  const linkAtEnd = includeLink && (channel === "sms" || channel === "whatsapp");
  const linkifyId = includeLink && (channel === "email" || channel === "slack");
  const showPdf = attachPdf && channelAttachesPdf(channel);

  const body = linkifyId ? (
    <>
      {message.split(invoiceId).map((part, i, arr) => (
        <React.Fragment key={i}>
          {part}
          {i < arr.length - 1 && (
            <a href={url} className={MODAL_LINK}>
              {invoiceId}
            </a>
          )}
        </React.Fragment>
      ))}
    </>
  ) : (
    message
  );

  return (
    <div className="rounded-xl border border-line-strong bg-card px-3.5 py-3 text-[13.5px] leading-relaxed text-ink">
      <div className="whitespace-pre-wrap">
        {body}
        {linkAtEnd && (
          <>
            {"\n\n"}
            <a href={url} className={`break-all ${MODAL_LINK}`}>
              {url}
            </a>
          </>
        )}
      </div>
      {showPdf && (
        <div className="mt-3 inline-flex w-fit max-w-full items-center gap-2 rounded-lg border border-line bg-well-muted px-3 py-2 text-[12.5px]">
          <Paperclip size={14} className="shrink-0 text-muted" />
          <span className="font-medium text-ink">{invoiceId}.pdf</span>
        </div>
      )}
    </div>
  );
};

const buildStoredReminder = (invoiceId: string): SentReminder | undefined => {
  const invoice = INVOICES[invoiceId];
  const stored = INVOICE_REMINDERS[invoiceId];
  if (!invoice || !stored) return undefined;
  const target: ReminderTarget = {
    client: invoice.client,
    invoice: invoice.id,
    amount: invoice.amount,
    statusLabel: invoice.dueLabel,
    status: invoice.status,
  };
  return {
    target,
    channel: stored.channel,
    voice: "Friendly",
    message: buildMessage(target, "Friendly"),
    subject: `Reminder: Invoice ${invoice.id} (${money(invoice.amount)})`,
    includeLink: true,
    attachPdf: true,
    copyMe: false,
    agentSent: AGENT_SENT_INVOICES.has(invoiceId),
  };
};

const hasReminderSent = (invoiceId: string, sentReminders: Record<string, SentReminder>): boolean =>
  !!sentReminders[invoiceId] || !!INVOICE_REMINDERS[invoiceId];

const ReminderCtx = React.createContext<(t: ReminderTarget, view?: boolean) => void>(() => {});
const SentRemindersCtx = React.createContext<Record<string, SentReminder>>({});
const useOpenReminder = () => React.useContext(ReminderCtx);
const useSentReminders = () => React.useContext(SentRemindersCtx);

/* ---------------------------- primitives ---------------------------- */

const ICON_WELL = "bg-well text-muted ring-1 ring-line";
const TAB_SELECTED = "bg-card text-ink shadow-sm";
const HOVER_CARD = "hover-card";
const HOVER_CARD_BODY = `${HOVER_CARD} rounded-lg px-3 py-2 text-[13px] leading-snug text-ink`;
const INPUT_FOCUS = "outline-none transition focus-visible:border-line-strong focus-visible:ring-2 focus-visible:ring-ring";

const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = "", children }) => (
  <div className={`rounded-2xl border border-card-border bg-card ${className}`}>{children}</div>
);

const SectionTitle: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode }> = ({ title, subtitle, right }) => (
  <div className="mb-4 flex items-end justify-between gap-4">
    <div>
      <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
      {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
    </div>
    {right}
  </div>
);

const StatusPill: React.FC<{ tone: Tone; label: string; dot?: boolean; className?: string }> = ({ tone, label, dot = true, className = "" }) => {
  const t = TONE[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${t.bg} px-2.5 py-1 text-[12px] font-medium ring-1 ${t.ring} ${t.text} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />}
      {label}
    </span>
  );
};

const GhostButton: React.FC<React.PropsWithChildren<{ tone?: Tone; onClick?: () => void; className?: string }>> = ({ tone, children, onClick, className = "" }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition
      ${tone === "red" ? "text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/15" : tone === "amber" ? "text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/15" : "text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-500/15"} ${className}`}
  >
    {children}
  </button>
);

/* ---------------------------- app sidebar ---------------------------- */

const SIDEBAR_NAV = [
  { label: "Dashboard", icon: LayoutGrid },
  { label: "Agents", icon: Sparkle },
  { label: "Clients", icon: Users },
  { label: "Projects", icon: FolderKanban },
  { label: "Invoices", icon: FileText },
  { label: "Earnings", icon: ChartColumnIncreasing, active: true },
  { label: "Expenses", icon: Receipt },
  { label: "Taxes", icon: Landmark },
  { label: "Reports", icon: ChartPie },
] as const;

const SIDEBAR_FOOTER_NAV = [
  { label: "Connections", icon: Waypoints },
  { label: "Settings", icon: Settings },
] as const;

const NavUser: React.FC = () => (
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton size="lg" tooltip={`${FREELANCER.name}\n${FREELANCER.email}`}>
        <img
          src="./assets/jordan-avatar.jpg"
          alt={FREELANCER.name}
          className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-sidebar-border"
        />
        <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
          <span data-sidebar-label className="truncate font-medium">
            {FREELANCER.name}
          </span>
          <span className="truncate text-xs text-muted">{FREELANCER.email}</span>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
);

const AppSidebar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { toggleSidebar } = useSidebar();

  return (
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" tooltip="wipOS" className="brand-toggle group/brand" onClick={toggleSidebar}>
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg">
              <CircleDashed size={16} className="brand-icon-dash transition-opacity group-hover/brand:opacity-0" />
              <PanelLeft size={16} className="absolute opacity-0 transition-opacity group-hover/brand:opacity-100" />
            </span>
            <span data-sidebar-label className="brand-title truncate text-[24px] leading-none tracking-tight group-data-[collapsible=icon]:hidden">
              wipOS
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup className="p-0">
        <SidebarGroupContent>
          <SidebarMenu>
            {SIDEBAR_NAV.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton isActive={"active" in item && item.active} tooltip={item.label}>
                  <item.icon />
                  <span data-sidebar-label className="truncate group-data-[collapsible=icon]:hidden">
                    {item.label}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <SidebarMenu>
        {SIDEBAR_FOOTER_NAV.map((item) => (
          <SidebarMenuItem key={item.label}>
            <SidebarMenuButton tooltip={item.label}>
              <item.icon />
              <span data-sidebar-label className="truncate group-data-[collapsible=icon]:hidden">
                {item.label}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            onClick={toggleTheme}
          >
            <Eclipse size={16} />
            <span data-sidebar-label className="truncate group-data-[collapsible=icon]:hidden">
              Appearance
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <NavUser />
    </SidebarFooter>
  </Sidebar>
  );
};

/* ---------------------------- header ---------------------------- */

const Header: React.FC = () => (
  <header className="sticky top-0 z-30 bg-canvas/80 backdrop-blur-xl">
    <div className="flex flex-col gap-4 px-4 pb-4 pt-5 md:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-ink">Earnings</h1>
        <p className="mt-1 text-[14px] text-muted">Track paid, expected, and overdue income across your clients</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-card px-3.5 py-2 text-[13px] font-medium text-ink transition hover:bg-hover">
          <Download size={15} /> Export report
        </button>
        <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-fg shadow-lift transition hover:opacity-90">
          <Plus size={15} /> Create invoice
        </button>
      </div>
    </div>
  </header>
);

/* ---------------------------- KPI card ---------------------------- */

const KpiCard: React.FC<{
  label: string;
  value: number;
  context: string;
  tone: Tone;
}> = ({ label, value, context, tone }) => {
  const t = TONE[tone];
  return (
    <Card className="group relative overflow-hidden p-5 transition">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <div className="mt-3 text-[28px] font-semibold tracking-[-0.04em] text-ink tnum">{money(value)}</div>
      <div className={`mt-1.5 text-[12.5px] font-medium ${t.text}`}>{context}</div>
    </Card>
  );
};

/* ---------------------------- chart ---------------------------- */

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const rows: { key: string; tone: Tone }[] = [
    { key: "paid", tone: "green" },
    { key: "expected", tone: "purple" },
    { key: "overdue", tone: "red" },
  ];
  const data = payload[0].payload;
  return (
    <div className={`rounded-xl ${HOVER_CARD} p-3`}>
      <div className="mb-1.5 text-[12px] font-semibold text-ink">{label}</div>
      {rows.map((r) => (
        <div key={r.key} className="flex items-center justify-between gap-6 text-[12.5px]">
          <span className="flex items-center gap-1.5 capitalize text-muted">
            <span className={`h-2 w-2 rounded-full ${TONE[r.tone].dot}`} />
            {r.key}
          </span>
          <span className="font-medium text-ink tnum">{money(data[r.key])}</span>
        </div>
      ))}
    </div>
  );
};

const LegendDot: React.FC<{ tone: Tone; label: string }> = ({ tone, label }) => (
  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted">
    <span className={`h-2 w-2 rounded-full ${TONE[tone].dot}`} />
    {label}
  </span>
);

const EarningsChart: React.FC = () => {
  const { theme } = useTheme();
  const [range, setRange] = React.useState<ChartRange>(6);
  const data = chartSlice(range);
  const insight = buildOnTrackInsight(range);
  const gridStroke = theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const tickFill = theme === "dark" ? "#636366" : "#86868b";

  return (
  <Card className="flex h-full w-full flex-col p-5 md:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Monthly earnings</h2>
        <div className="mt-0.5 flex items-center gap-4">
          <LegendDot tone="green" label="Paid" />
          <LegendDot tone="purple" label="Expected" />
          <LegendDot tone="red" label="Overdue" />
        </div>
      </div>
      <div className="inline-flex shrink-0 rounded-xl border border-line bg-well-muted p-0.5">
        {CHART_RANGE_TABS.map((tab) => (
          <button
            key={tab.months}
            onClick={() => setRange(tab.months)}
            className={`rounded-[10px] px-3 py-1.5 text-[12.5px] font-medium transition whitespace-nowrap
              ${range === tab.months ? TAB_SELECTED : "text-muted hover:text-ink"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>

    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-well-soft px-4 py-3.5 dark:bg-well-muted">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 size={18} />
      </span>
      <div>
        <div className="text-[15px] font-semibold text-ink">Jordan, you&apos;re on track!</div>
        <div className="text-[12.5px] leading-relaxed text-muted">
          {insight.month} is forecasted to close{" "}
          <b className="font-semibold text-ink">
            {insight.pct}% {insight.above ? "above" : "below"}
          </b>{" "}
          your {insight.months}-month average, but{" "}
          <b className={`font-semibold ${TONE.red.text}`}>{moneyK(insight.overdue)} is currently overdue</b>.
        </div>
      </div>
    </div>

    <div className="mt-5 min-h-[180px] flex-1 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={gridStroke} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: tickFill, fontSize: 12 }} dy={6} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: tickFill, fontSize: 12 }} tickFormatter={moneyK} width={56} />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
            content={<ChartTooltip />}
            contentStyle={{ backgroundColor: "transparent", border: "none", padding: 0, boxShadow: "none" }}
            wrapperStyle={{ outline: "none", zIndex: 50 }}
          />
          <Bar dataKey="paid" stackId="a" fill={TONE.green.solid} maxBarSize={46} />
          <Bar dataKey="expected" stackId="a" fill={TONE.purple.solid} maxBarSize={46} />
          <Bar dataKey="overdue" stackId="a" fill={TONE.red.solid} radius={[6, 6, 0, 0]} maxBarSize={46} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </Card>
  );
};

/* ---------------------------- cash confidence ---------------------------- */

const CashConfidence: React.FC = () => {
  const openReminder = useOpenReminder();
  return (
  <Card className="flex flex-col p-5 md:p-6">
    <div className="flex items-center justify-between">
      <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Cash confidence</h2>
      <ShieldCheck size={18} className="text-emerald-500" />
    </div>

    <div className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-600/10">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
        <CheckCircle2 size={18} />
      </span>
      <div>
        <div className="text-[15px] font-semibold text-emerald-800">On track</div>
        <div className="text-[12.5px] text-emerald-700/80">This month is healthy overall</div>
      </div>
    </div>

    <ul className="mt-4 space-y-3 text-[13px]">
      <li className="flex items-start gap-2.5">
        <Clock size={15} className="mt-0.5 shrink-0 text-violet-500 dark:text-violet-400" />
        <span className="text-muted">You have <b className="font-semibold text-ink tnum">$9,430</b> expected before month-end</span>
      </li>
      <li className="flex items-start gap-2.5">
        <AlertTriangle size={15} className="mt-0.5 shrink-0 text-rose-500" />
        <span className="text-muted">Risk: <b className="font-semibold text-rose-700 tnum">$4,300</b> currently overdue</span>
      </li>
    </ul>

    <div className="mt-auto pt-4">
      <div className="rounded-xl border border-line bg-well-muted p-3.5">
        <div className="text-[11.5px] font-medium uppercase tracking-wide text-faint">Recommended next action</div>
        <div className="mt-1 text-[13.5px] font-medium text-ink">Follow up on Bluebird Studio</div>
        <button
          onClick={() => openReminder({ client: "Bluebird Studio", invoice: "INV-1041", amount: 1900, statusLabel: "Overdue 12 days", status: "overdue" })}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-[13px] font-semibold text-primary-fg transition hover:opacity-90"
        >
          <Send size={14} /> Send reminder
        </button>
      </div>
    </div>
  </Card>
  );
};

/* ---------------------------- payment pipeline ---------------------------- */

const PaymentItemRow: React.FC<{ item: Payment }> = ({ item }) => {
  const openInvoice = useOpenInvoice();
  const openReminder = useOpenReminder();
  const sentReminders = useSentReminders();
  const tone = STATUS_TONE[item.status];
  const canRemind = item.status === "due" || item.status === "overdue" || item.status === "expected";
  const reminderSent = hasReminderSent(item.invoice, sentReminders);
  const reminderTarget = { client: item.client, invoice: item.invoice, amount: item.amount, statusLabel: item.due, status: item.status };
  const btnBase = "inline-flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition";
  const btnNeutral = `${btnBase} border border-line-strong bg-card text-ink hover:bg-hover`;
  const btnPrimary = `${btnBase} bg-primary text-primary-fg hover:opacity-90`;
  return (
    <div className="rounded-xl border border-card-border bg-card p-3 transition hover:border-line-strong">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-semibold text-ink">{item.client}</div>
          <div className="mt-0.5 text-[12px] text-faint tnum">{item.invoice}</div>
          <div className={`mt-0.5 text-[12px] font-medium ${TONE[tone].text}`}>{item.due}</div>
        </div>
        <div className="text-right text-[14px] font-semibold text-ink tnum">{money(item.amount)}</div>
      </div>
      {item.action && (
        <div className="mt-3 flex flex-wrap items-center justify-start gap-2">
          {canRemind &&
            (reminderSent ? (
              <button onClick={() => openReminder(reminderTarget, true)} className={btnNeutral}>
                <Check size={13} className="text-emerald-600" /> Reminder sent
              </button>
            ) : (
              <button onClick={() => openReminder(reminderTarget, false)} className={btnPrimary}>
                <Send size={13} /> Send reminder
              </button>
            ))}
          <button onClick={() => openInvoice(item.invoice)} className={btnNeutral}>
            <Eye size={13} /> View
          </button>
        </div>
      )}
    </div>
  );
};

const PipelineColumn: React.FC<{ column: (typeof PIPELINE)[number] }> = ({ column }) => {
  const total = column.items.reduce((s, i) => s + i.amount, 0);
  return (
    <Card className="flex flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${TONE[column.tone].dot}`} />
          <span className="text-[13.5px] font-semibold text-ink">{column.title}</span>
          <span className="rounded-full bg-hover px-1.5 py-0.5 text-[11px] font-medium text-muted">{column.items.length}</span>
        </div>
        <span className="text-[12.5px] font-medium text-muted tnum">{money(total)}</span>
      </div>
      <div className="space-y-2.5">
        {column.items.map((item) => (
          <PaymentItemRow key={item.invoice + item.due} item={item} />
        ))}
      </div>
    </Card>
  );
};

/* ---------------------------- invoices table ---------------------------- */

const InvoiceRow: React.FC<{ invoice: Invoice }> = ({ invoice }) => {
  const openInvoice = useOpenInvoice();
  const openReminder = useOpenReminder();
  const sentReminders = useSentReminders();
  const tone = STATUS_TONE[invoice.status];
  const canRemind = invoice.status === "due" || invoice.status === "overdue" || invoice.status === "expected";
  const reminderTarget = {
    client: invoice.client,
    invoice: invoice.id,
    amount: invoice.amount,
    statusLabel: invoice.dueLabel,
    status: invoice.status,
  };
  const sent = sentReminders[invoice.id];
  const stored = INVOICE_REMINDERS[invoice.id];
  const lastReminder = sent
    ? { channel: sent.channel, when: formatLastComm(new Date()) }
    : stored
    ? { channel: stored.channel, when: formatLastComm(stored.at) }
    : null;
  const reminderSent = hasReminderSent(invoice.id, sentReminders);
  const reminderChannel = lastReminder ? getChannel(lastReminder.channel) : undefined;
  const btnBase = "inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium transition whitespace-nowrap";
  const btnNeutral = `${btnBase} border border-line-strong bg-card text-ink hover:bg-hover`;
  const btnPrimary = `${btnBase} bg-primary text-primary-fg hover:opacity-90`;

  return (
    <tr
      onClick={() => openInvoice(invoice.id)}
      className="cursor-pointer border-t border-line transition hover:bg-hover"
    >
      <td className="py-3.5 pl-5 pr-4">
        <div className="flex items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ICON_WELL}`}>
            <FileText size={16} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-medium text-ink tnum">{invoice.id}</div>
            <div className="mt-0.5 truncate text-[12px] text-faint">{invoice.client}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-right text-[13.5px] font-semibold text-ink tnum">{money(invoice.amount)}</td>
      <td className="px-4 py-3.5">
        <div className="text-[13px] text-muted tnum">{invoice.dueDate}</div>
        <div className={`mt-0.5 text-[12px] font-medium ${TONE[tone].text}`}>{invoice.dueLabel}</div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill tone={tone} label={STATUS_LABEL[invoice.status]} dot={false} />
          {invoice.status !== "overdue" && <StatusPill tone="slate" label="Viewed" dot={false} />}
        </div>
      </td>
      <td className="px-4 py-3.5 text-[13px] text-muted">{invoice.terms}</td>
      <td className="px-4 py-3.5 text-[13px] text-muted">{invoice.paymentMethod}</td>
      <td className="px-4 py-3.5">
        {lastReminder && reminderChannel ? (
          <span className="text-[13px] text-muted">{lastReminder.when} via {reminderChannel.label}</span>
        ) : (
          <span className="text-[13px] text-faint">—</span>
        )}
      </td>
      <td className="py-3.5 pl-4 pr-5">
        <div className="flex items-center justify-end gap-1.5">
          {canRemind &&
            (reminderSent ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openReminder(reminderTarget, true);
                }}
                className={btnNeutral}
              >
                <Check size={12} className="text-emerald-600" /> Reminder sent
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openReminder(reminderTarget, false);
                }}
                className={btnPrimary}
              >
                <Send size={12} /> Send reminder
              </button>
            ))}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openInvoice(invoice.id);
            }}
            className={btnNeutral}
          >
            <Eye size={12} /> View
          </button>
        </div>
      </td>
    </tr>
  );
};

const InvoicesList: React.FC = () => (
  <Card className="overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px]">
        <thead>
          <tr className="text-[11.5px] font-medium uppercase tracking-wide text-faint">
            <th className="pb-2 pt-4 pl-5 pr-4 text-left font-medium">Invoice</th>
            <th className="px-4 pb-2 pt-4 text-right font-medium">Amount</th>
            <th className="px-4 pb-2 pt-4 text-left font-medium">Due</th>
            <th className="px-4 pb-2 pt-4 text-left font-medium">Status</th>
            <th className="px-4 pb-2 pt-4 text-left font-medium">Terms</th>
            <th className="px-4 pb-2 pt-4 text-left font-medium">Payment method</th>
            <th className="px-4 pb-2 pt-4 text-left font-medium">Last reminder</th>
            <th className="pb-2 pt-4 pl-4 pr-5" aria-hidden="true" />
          </tr>
        </thead>
        <tbody>
          {INVOICE_LIST.map((invoice) => (
            <InvoiceRow key={invoice.id} invoice={invoice} />
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

type PipelineView = "cards" | "list";

const PIPELINE_VIEWS: { key: PipelineView; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: "cards", label: "Cards", icon: LayoutGrid },
  { key: "list", label: "List", icon: List },
];

const PaymentPipelineSection: React.FC = () => {
  const [view, setView] = React.useState<PipelineView>("cards");

  return (
    <section>
      <SectionTitle
        title="Monthly payment pipeline"
        subtitle="Money moving in, grouped by what it needs from you"
        right={
          <div className="inline-flex shrink-0 rounded-xl border border-line bg-well-muted p-0.5">
            {PIPELINE_VIEWS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[12.5px] font-medium transition whitespace-nowrap
                  ${view === tab.key ? TAB_SELECTED : "text-muted hover:text-ink"}`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        }
      />
      {view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PIPELINE.map((col) => (
            <PipelineColumn key={col.key} column={col} />
          ))}
        </div>
      ) : (
        <InvoicesList />
      )}
    </section>
  );
};

/* ---------------------------- needs attention ---------------------------- */

const AttentionItemRow: React.FC<{ item: Attention }> = ({ item }) => {
  const t = TONE[item.tone];
  const openInvoice = useOpenInvoice();
  const openReminder = useOpenReminder();
  const onAction = item.reminder
    ? () => openReminder(item.reminder!)
    : item.invoiceId
    ? () => openInvoice(item.invoiceId!)
    : undefined;
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-hover">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.bg} ${t.text}`}>
        <item.icon size={16} />
      </span>
      <p className="min-w-0 flex-1 text-[13.5px] leading-snug text-muted">{item.text}</p>
      <GhostButton tone={item.tone === "green" ? "purple" : item.tone} onClick={onAction}>
        {item.action} <ArrowUpRight size={13} />
      </GhostButton>
    </div>
  );
};

const NeedsAttention: React.FC = () => (
  <Card className="p-5 md:p-6">
    <SectionTitle
      title="Needs attention"
      subtitle="Prioritized — handle these first"
      right={<Bell size={18} className="text-amber-500" />}
    />
    <div className="-mx-1 divide-y divide-line">
      {ATTENTION.map((item, i) => (
        <AttentionItemRow key={i} item={item} />
      ))}
    </div>
  </Card>
);

/* ---------------------------- recent activity ---------------------------- */

const RecentActivity: React.FC = () => (
  <Card className="flex h-full w-full flex-col p-5 md:p-6">
    <SectionTitle title="Recent activity" />
    <ol className="relative ml-1 space-y-4 border-l border-line pl-5">
      {ACTIVITY.map((a, i) => (
        <li key={i} className="relative">
          <span className={`absolute -left-[30px] flex h-5 w-5 items-center justify-center rounded-full ${TONE[a.tone].bg} ${TONE[a.tone].text}`}>
            <a.icon size={11} />
          </span>
          <p className="text-[13px] leading-snug text-muted">{a.text}</p>
          <p className="mt-0.5 text-[11.5px] text-faint">{a.time}</p>
        </li>
      ))}
    </ol>
  </Card>
);

/* ---------------------------- top clients ---------------------------- */

const ClientNotesCtx = React.createContext<{
  notes: Record<string, string>;
  setNote: (client: string, note: string) => void;
}>({ notes: {}, setNote: () => {} });
const useClientNotes = () => React.useContext(ClientNotesCtx);

const ClientNoteField: React.FC<{ client: string }> = ({ client }) => {
  const { notes, setNote } = useClientNotes();
  const value = notes[client] ?? "";
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [showTip, setShowTip] = React.useState(false);

  const maybeShowTip = () => {
    const el = inputRef.current;
    setShowTip(!!value && !!el && el.scrollWidth > el.clientWidth);
  };

  return (
    <div
      className="relative max-w-[180px]"
      onMouseEnter={maybeShowTip}
      onMouseLeave={() => setShowTip(false)}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setNote(client, e.target.value)}
        onBlur={(e) => setNote(client, e.target.value.trim())}
        onFocus={() => setShowTip(false)}
        onClick={(e) => e.stopPropagation()}
        placeholder="Add note"
        className="w-full truncate border-0 bg-transparent p-0 text-[13px] leading-snug text-ink outline-none placeholder:text-faint"
      />
      {showTip && (
        <div className={`pointer-events-none absolute left-0 top-full z-30 mt-1.5 max-w-[260px] ${HOVER_CARD_BODY}`}>
          {value}
        </div>
      )}
    </div>
  );
};

const ClientRow: React.FC<{ client: Client }> = ({ client }) => {
  const overdue = clientOverdueTotal(client.name);
  return (
  <tr className="border-t border-line transition hover:bg-hover">
    <td className="py-3.5 pl-5 pr-4">
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium text-ink">{client.name}</div>
        <div className="mt-0.5 truncate text-[12px] text-faint">{clientInvoiceSubtitle(client.name)}</div>
      </div>
    </td>
    <td className="px-4 py-3.5 text-right text-[13.5px] font-medium text-ink tnum">{money(client.revenue)}</td>
    <td className="px-4 py-3.5 text-right text-[13.5px] tnum">
      {overdue > 0 ? <span className={`font-medium ${TONE.red.text}`}>{money(overdue)}</span> : <span className="text-faint">—</span>}
    </td>
    <td className="px-4 py-3.5 text-right text-[13.5px] text-muted tnum">{client.avgDays} days</td>
    <td className="px-4 py-3.5">
      <span className="block max-w-[200px] text-[13px] leading-snug text-muted">{client.insight}</span>
    </td>
    <td className="px-4 py-3.5 text-right">
      <StatusPill tone={RELIABILITY_TONE[client.reliability]} label={client.reliability} dot={false} />
    </td>
    <td className="py-3.5 pl-4 pr-5">
      <ClientNoteField client={client.name} />
    </td>
  </tr>
  );
};

const TopClientsSection: React.FC = () => (
  <section>
    <SectionTitle
      title="Top clients"
      subtitle="Revenue and reliability across your roster this year"
      right={
        <button className="hidden w-fit items-center gap-1.5 rounded-lg border border-line-strong bg-card px-2.5 py-1.5 text-[12.5px] font-medium text-ink transition hover:bg-hover sm:inline-flex">
          View all
        </button>
      }
    />
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px]">
          <thead>
            <tr className="text-[11.5px] font-medium uppercase tracking-wide text-faint">
              <th className="pb-2 pt-4 pl-5 pr-4 text-left font-medium">Client</th>
              <th className="px-4 pb-2 pt-4 text-right font-medium">Revenue this year</th>
              <th className="px-4 pb-2 pt-4 text-right font-medium">Overdue invoices</th>
              <th className="px-4 pb-2 pt-4 text-right font-medium">Avg. days to pay</th>
              <th className="px-4 pb-2 pt-4 text-left font-medium">
                <span className="inline-flex items-center gap-1.5">
                  Insights
                  <Sparkle size={12} className="text-faint" />
                </span>
              </th>
              <th className="px-4 pb-2 pt-4 text-right font-medium">Reliability</th>
              <th className="pb-2 pt-4 pl-4 pr-5 text-left font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {CLIENTS.map((c) => (
              <ClientRow key={c.name} client={c} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </section>
);

/* ---------------------------- modal shell ---------------------------- */

const useModalShell = (onClose: () => void) => {
  React.useEffect(() => {
    const lockedY = window.scrollY;
    const scrollRoot = document.documentElement;

    const inModalScroll = (target: EventTarget | null) =>
      target instanceof Element && !!target.closest('[role="dialog"] .modal-scroll');

    const onScroll = () => {
      if (window.scrollY !== lockedY) window.scrollTo(0, lockedY);
    };

    const onWheel = (e: WheelEvent) => {
      const scrollEl = e.target instanceof Element ? e.target.closest<HTMLElement>(".modal-scroll") : null;
      if (scrollEl) {
        const { scrollTop, scrollHeight, clientHeight } = scrollEl;
        const up = e.deltaY < 0;
        const down = e.deltaY > 0;
        if ((up && scrollTop > 0) || (down && scrollTop + clientHeight < scrollHeight)) return;
      }
      e.preventDefault();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!inModalScroll(e.target)) e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      const scrollKeys = [" ", "PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown"];
      if (scrollKeys.includes(e.key) && !inModalScroll(e.target)) e.preventDefault();
    };

    scrollRoot.style.overscrollBehavior = "none";
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("keydown", onKeyDown);

    return () => {
      scrollRoot.style.overscrollBehavior = "";
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("wheel", onWheel);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("keydown", onKeyDown);
      window.scrollTo(0, lockedY);
    };
  }, [onClose]);
};

/* ---------------------------- invoice preview ---------------------------- */

const InvoicePreview: React.FC<{ invoice: Invoice; onClose: () => void }> = ({ invoice, onClose }) => {
  const openReminder = useOpenReminder();
  useModalShell(onClose);

  const tone = STATUS_TONE[invoice.status];
  const subtotal = invoice.lines.reduce((s, l) => s + l.amount, 0);
  const primaryLabel = invoice.status === "paid" ? "Download receipt" : "Send reminder";
  const onPrimary =
    primaryLabel === "Send reminder"
      ? () => {
          onClose();
          openReminder({ client: invoice.client, invoice: invoice.id, amount: invoice.amount, statusLabel: invoice.dueLabel, status: invoice.status });
        }
      : undefined;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm animate-[overlayIn_150ms_ease-out] sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={"Invoice " + invoice.id}
        className="flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-3xl bg-card shadow-lift animate-[dialogIn_180ms_ease-out] sm:rounded-3xl"
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-3">
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${ICON_WELL}`}>
              <FileText size={16} />
            </span>
            <div>
              <div className="text-[15px] font-semibold tracking-tight text-ink">Invoice {invoice.id}</div>
              <div className="text-[12px] text-faint">Issued {invoice.issued}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <StatusPill tone={tone} label={STATUS_LABEL[invoice.status]} dot={false} />
            {invoice.status !== "overdue" && <StatusPill tone="slate" label="Viewed" dot={false} />}
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-hover hover:text-ink"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* body */}
        <div className="modal-scroll flex-1 overflow-y-auto px-6 py-5">
          <div className="flex justify-between gap-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-faint">From</div>
              <div className="mt-1 text-[13.5px] font-semibold text-ink">{FREELANCER.name}</div>
              <div className="text-[12.5px] text-faint">{FREELANCER.email}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-medium uppercase tracking-wide text-faint">Bill to</div>
              <div className="mt-1 text-[13.5px] font-semibold text-ink">{invoice.client}</div>
              <div className="text-[12.5px] text-faint">{invoice.clientEmail}</div>
            </div>
          </div>

          {/* amount */}
          <div className="mt-5 rounded-2xl border border-line bg-well-muted px-4 py-3.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] text-muted">{invoice.status === "paid" ? "Amount paid" : "Amount due"}</div>
                <div className={`mt-0.5 text-[12.5px] font-medium ${TONE[tone].text}`}>
                  {invoice.status === "paid" ? `Paid ${invoice.paidDate ?? invoice.dueDate}` : `Due ${invoice.dueDate}`}
                </div>
              </div>
              <div className="text-[24px] font-semibold tracking-[-0.02em] text-ink tnum">{money(invoice.amount)}</div>
            </div>
            <div className="mt-3 border-t border-line pt-2.5 text-[12px] text-muted">{invoice.note}</div>
          </div>

          {/* line items */}
          <div className="mt-5">
            <div className="flex items-center justify-between pb-2 text-[11px] font-medium uppercase tracking-wide text-faint">
              <span>Description</span>
              <span>Amount</span>
            </div>
            <div className="divide-y divide-line border-y border-line">
              {invoice.lines.map((l, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="pr-4">
                    <div className="text-[13.5px] font-medium text-ink">{l.desc}</div>
                    <div className="mt-0.5 text-[12px] text-faint tnum">
                      {l.qty} {l.unit} × {money(l.rate)}
                    </div>
                  </div>
                  <div className="text-[13.5px] font-medium text-ink tnum">{money(l.amount)}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-[13px] text-muted">
                <span>Subtotal</span>
                <span className="tnum">{money(subtotal)}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-[15px] font-semibold text-ink">
                <span>Total</span>
                <span className="tnum">{money(invoice.amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
          <button className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-card px-3.5 py-2 text-[13px] font-medium text-ink transition hover:bg-hover">
            <Download size={15} /> Download PDF
          </button>
          <button onClick={onPrimary} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-fg transition hover:opacity-90">
            {invoice.status === "paid" ? <Download size={15} /> : <Send size={15} />} {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------- send reminder ---------------------------- */

const Toggle: React.FC<{ on: boolean; onChange: () => void; icon: React.ComponentType<{ size?: number; className?: string }>; label: string; hint?: string }> = ({ on, onChange, icon: Icon, label, hint }) => (
  <button onClick={onChange} className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-left">
    <span className="flex items-center gap-2 text-[13px] text-ink">
      <Icon size={14} className="text-muted" />
      {label}
      {hint && <span className="text-faint">· {hint}</span>}
    </span>
    <span
      className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${on ? "bg-primary" : "bg-input dark:bg-well-soft"}`}
      aria-hidden="true"
    >
      <span className={`block h-4 w-4 rounded-full bg-card ring-0 transition-transform ${on ? "translate-x-4" : "translate-x-0"}`} />
    </span>
  </button>
);

const VOICES = ["Friendly", "Neutral", "Firm"] as const;

const ReminderModal: React.FC<{
  target: ReminderTarget;
  onClose: () => void;
  startInReceipt?: boolean;
  initial?: SentReminder;
  onSent?: (r: SentReminder) => void;
}> = ({ target, onClose, startInReceipt, initial, onSent }) => {
  const contact = getContact(target.client);
  const tone = STATUS_TONE[target.status];
  const quickChannel = getQuickChannel(contact);
  const [channel, setChannel] = useState<string>(initial?.channel ?? "email");
  const [voice, setVoice] = useState<string>(initial?.voice ?? "Friendly");
  const [message, setMessage] = useState<string>(() => initial?.message ?? buildMessage(target, "Friendly"));
  const [subject, setSubject] = useState<string>(initial?.subject ?? `Reminder: Invoice ${target.invoice} (${money(target.amount)})`);
  const [includeLink, setIncludeLink] = useState<boolean>(initial?.includeLink ?? true);
  const [attachPdf, setAttachPdf] = useState<boolean>(initial?.attachPdf ?? true);
  const [copyMe, setCopyMe] = useState<boolean>(initial?.copyMe ?? false);
  const [sent, setSent] = useState<boolean>(!!startInReceipt);

  const firstRun = React.useRef(true);
  React.useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setMessage(buildMessage(target, voice));
  }, [voice, target]);

  useModalShell(onClose);

  const active = CHANNELS.find((c) => c.key === channel) as Channel;
  const isEmail = channel === "email";
  const showPdfToggle = channelAttachesPdf(channel);
  const seenAt = React.useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - 2);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }, []);

  const handleSend = () => {
    onSent?.({ target, channel, voice, message, subject, includeLink, attachPdf, copyMe });
    setSent(true);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm animate-[overlayIn_150ms_ease-out] sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={"Send reminder to " + target.client}
        className="flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-3xl bg-card shadow-lift animate-[dialogIn_180ms_ease-out] sm:rounded-3xl"
      >
        {sent ? (
          <>
            {/* header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${TONE.green.bg} ${TONE.green.text}`}>
                  <CheckCircle2 size={18} />
                </span>
                <div>
                  <div className="text-[15px] font-semibold tracking-tight text-ink">Reminder sent</div>
                  <div className="text-[12px] text-faint">
                    {target.client} · {target.invoice} · Just now
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-hover hover:text-ink"
              >
                <X size={17} />
              </button>
            </div>

            {/* receipt */}
            <div className="modal-scroll flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {/* channel */}
              <div className="flex items-center gap-3 rounded-2xl border border-line bg-well-muted px-4 py-3.5">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ICON_WELL}`}>
                  <active.icon size={16} />
                </span>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium text-ink">Sent via {active.label}</div>
                  <div className="truncate text-[12px] text-faint">{active.get(contact)}</div>
                </div>
                <span className="ml-auto shrink-0 text-[11.5px] font-medium text-emerald-600">
                  Seen at {seenAt}
                </span>
              </div>

              {/* message + tone */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-faint">Message</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-500/15 dark:text-neutral-400">{voice} tone</span>
                </div>
                {isEmail && (
                  <div className="mb-2 rounded-xl border border-line-strong bg-card px-3.5 py-3 text-[13.5px] leading-relaxed text-ink">
                    <span className="text-faint">Subject · </span>
                    {subject}
                  </div>
                )}
                <ReminderMessageBody
                  message={message}
                  invoiceId={target.invoice}
                  channel={channel}
                  includeLink={includeLink}
                  attachPdf={attachPdf}
                />
                {initial?.agentSent && (
                  <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-line px-3.5 py-3">
                    <Sparkle size={14} className="mt-0.5 shrink-0 text-muted" />
                    <p className="text-[12.5px] leading-relaxed text-muted">
                      This reminder was automatically sent by the <span className="font-medium text-ink">wipOS agent</span>.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* footer */}
            <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
              <button
                onClick={() => setSent(false)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-card px-3.5 py-2 text-[13px] font-medium text-ink transition hover:bg-hover"
              >
                <Send size={15} /> Send another reminder
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-fg transition hover:opacity-90"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            {/* header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${ICON_WELL}`}>
                  <Send size={16} />
                </span>
                <div>
                  <div className="text-[15px] font-semibold tracking-tight text-ink">Send reminder</div>
                  <div className="text-[12px] text-faint">
                    {target.client} · {target.invoice}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <StatusPill tone={tone} label={target.statusLabel} dot={false} />
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-hover hover:text-ink"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* body */}
            <div className="modal-scroll flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {/* channel picker */}
              <div>
                <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-faint">Channel</div>
                <div className="grid grid-cols-2 gap-2.5">
                  {CHANNELS.map((ch) => {
                    const selected = channel === ch.key;
                    return (
                      <button
                        key={ch.key}
                        onClick={() => setChannel(ch.key)}
                        className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition ${
                          selected ? "border-line-strong bg-hover dark:border-line-strong dark:bg-canvas" : "border-line hover:border-line-strong"
                        }`}
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-primary text-primary-fg" : ICON_WELL}`}>
                          <ch.icon size={15} />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
                            {ch.label}
                            {selected && <Check size={13} className="text-emerald-600" />}
                          </span>
                          <span className="block truncate text-[11.5px] text-faint">{ch.get(contact)}</span>
                          <span className="mt-1 block text-[10.5px] font-medium text-faint">
                            {(ch.key === quickChannel || ch.key === "whatsapp") && (
                              <>
                                <span className="text-emerald-600">Responds quickly</span>
                                {" · "}
                              </>
                            )}
                            Last contact {formatLastComm(contact.last[ch.key])}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* tone */}
              {/* subject (email only) */}
              {isEmail && (
                <div>
                  <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-faint">Subject</div>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={`w-full rounded-xl border border-line-strong bg-card px-3.5 py-2.5 text-[13.5px] text-ink ${INPUT_FOCUS}`}
                  />
                </div>
              )}

              {/* message */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-faint">Message</span>
                  <div className="inline-flex rounded-full border border-line bg-well-muted p-0.5">
                    {VOICES.map((v) => (
                      <button
                        key={v}
                        onClick={() => setVoice(v)}
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition ${voice === v ? "bg-card text-ink shadow-sm" : "text-faint hover:text-ink"}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={7}
                  className={`w-full resize-none rounded-xl border border-line-strong bg-card px-3.5 py-3 text-[13.5px] leading-relaxed text-ink ${INPUT_FOCUS}`}
                />
              </div>

              {/* options */}
              <div className="divide-y divide-line rounded-xl border border-line px-3 py-1">
                <Toggle on={includeLink} onChange={() => setIncludeLink((v) => !v)} icon={Link2} label="Include invoice link" />
                {showPdfToggle && (
                  <Toggle on={attachPdf} onChange={() => setAttachPdf((v) => !v)} icon={Paperclip} label="Attach invoice PDF" />
                )}
                <Toggle on={copyMe} onChange={() => setCopyMe((v) => !v)} icon={Mail} label="Send a copy to me" hint={FREELANCER.email} />
              </div>
            </div>

            {/* footer */}
            <div className="flex items-center justify-between gap-2 border-t border-line px-6 py-4">
              <span className="hidden items-center gap-1.5 text-[12px] text-faint sm:flex">
                <ShieldCheck size={13} className="text-emerald-500" />
                Delivered securely via wipOS
              </span>
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-card px-3.5 py-2 text-[13px] font-medium text-ink transition hover:bg-hover">
                  Cancel
                </button>
                <button onClick={handleSend} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-fg transition hover:opacity-90">
                  <active.icon size={15} /> Send via {active.label}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ---------------------------- dashboard ---------------------------- */

const Dashboard: React.FC = () => {
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [reminder, setReminder] = useState<{ target: ReminderTarget; view: boolean } | null>(null);
  const [sentReminders, setSentReminders] = useState<Record<string, SentReminder>>({});
  const [clientNotes, setClientNotes] = useState<Record<string, string>>(INITIAL_CLIENT_NOTES);
  const invoice = invoiceId ? INVOICES[invoiceId] : null;

  const openReminder = (target: ReminderTarget, view = false) => setReminder({ target, view });
  const recordReminder = (r: SentReminder) => setSentReminders((prev) => ({ ...prev, [r.target.invoice]: r }));
  const setClientNote = (client: string, note: string) => {
    setClientNotes((prev) => {
      const next = { ...prev };
      if (note) next[client] = note;
      else delete next[client];
      return next;
    });
  };

  return (
    <ThemeProvider>
    <InvoiceCtx.Provider value={setInvoiceId}>
    <SentRemindersCtx.Provider value={sentReminders}>
    <ReminderCtx.Provider value={openReminder}>
    <ClientNotesCtx.Provider value={{ notes: clientNotes, setNote: setClientNote }}>
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <Header />

        <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-5 md:px-6 md:py-6">
        {/* 1 — Financial health KPIs */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </section>

        {/* 2 — Chart + Recent activity */}
        <section className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
          <div className="flex lg:col-span-2">
            <EarningsChart />
          </div>
          <div className="flex">
            <RecentActivity />
          </div>
        </section>

        {/* 3 — Payment pipeline */}
        <PaymentPipelineSection />

        {/* 4 — Top clients */}
        <TopClientsSection />
        </div>

        {invoice && <InvoicePreview invoice={invoice} onClose={() => setInvoiceId(null)} />}
        {reminder && (
          <ReminderModal
            target={reminder.target}
            startInReceipt={reminder.view}
            initial={sentReminders[reminder.target.invoice] ?? buildStoredReminder(reminder.target.invoice)}
            onSent={recordReminder}
            onClose={() => setReminder(null)}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
    </ClientNotesCtx.Provider>
    </ReminderCtx.Provider>
    </SentRemindersCtx.Provider>
    </InvoiceCtx.Provider>
    </ThemeProvider>
  );
};

createRoot(document.getElementById("root")!).render(<Dashboard />);
