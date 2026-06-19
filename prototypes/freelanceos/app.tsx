import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { Command as CommandPrimitive } from "cmdk";
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
  Search,
  SearchX,
  CircleX,
  ArrowUp,
  ArrowDown,
  Link2,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Bell,
  Send,
  Loader2,
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
  Flag,
  Mic,
} from "lucide-react";

/* ---- shadcn sidebar inject ---- */

/* ---- shadcn command inject ---- */

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

const INITIAL_KPIS: { label: string; value: number; context: string; tone: Tone }[] = [
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

type ChartMonth = { month: string; paid: number; expected: number; overdue: number };

const INITIAL_CHART_ALL: ChartMonth[] = [
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

const chartSlice = (chart: ChartMonth[], months: ChartRange) => chart.slice(-months);

const buildOnTrackInsight = (chart: ChartMonth[], months: ChartRange) => {
  const data = chartSlice(chart, months);
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

type InvoiceStatus = "due" | "expected" | "overdue" | "paid";
type PaymentStatus = InvoiceStatus | "processing";

interface Payment {
  id: string;
  client: string;
  invoice: string;
  amount: number;
  due: string;
  status: PaymentStatus;
  action?: { label: string; icon: React.ComponentType<{ size?: number; className?: string }> };
}

type PipelineColumnData = {
  key: string;
  title: string;
  tone: Tone;
  items: Payment[];
};

const INITIAL_PIPELINE: PipelineColumnData[] = [
  {
    key: "processing",
    title: "Processing",
    tone: "slate",
    items: [],
  },
  {
    key: "overdue",
    title: "Overdue",
    tone: "red",
    items: [
      { id: "overdue-1041", client: "Bluebird Studio", invoice: "INV-1041", amount: 1900, due: "Overdue 12 days", status: "overdue", action: { label: "Send reminder", icon: Send } },
      { id: "overdue-1039", client: "Bluebird Studio", invoice: "INV-1039", amount: 2400, due: "Overdue 21 days", status: "overdue", action: { label: "Send reminder", icon: Send } },
    ],
  },
  {
    key: "due",
    title: "Due this week",
    tone: "amber",
    items: [
      { id: "due-1048", client: "Northstar Labs", invoice: "INV-1048", amount: 2400, due: "Due tomorrow", status: "due", action: { label: "View", icon: Eye } },
      { id: "due-1050", client: "Vertex Co.", invoice: "INV-1050", amount: 1250, due: "Due in 3 days", status: "due", action: { label: "View", icon: Eye } },
    ],
  },
  {
    key: "expected",
    title: "Expected later",
    tone: "purple",
    items: [
      { id: "expected-1052", client: "Orbit AI", invoice: "INV-1052", amount: 3800, due: "Expected Jun 28", status: "expected", action: { label: "View", icon: Eye } },
      { id: "expected-1055", client: "Northstar Labs", invoice: "INV-1055", amount: 2400, due: "Expected Jul 2", status: "expected", action: { label: "View", icon: Eye } },
    ],
  },
  {
    key: "paid",
    title: "Recently paid",
    tone: "green",
    items: [
      { id: "paid-1037", client: "Atlas Creative", invoice: "INV-1037", amount: 2750, due: "Paid yesterday", status: "paid", action: { label: "View", icon: Eye } },
      { id: "paid-1033", client: "Northstar Labs", invoice: "INV-1033", amount: 4200, due: "Paid 3 days ago", status: "paid", action: { label: "View", icon: Eye } },
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

interface ActivityMessagePreview {
  channel: "WhatsApp" | "Slack" | "Email";
  author: string;
  context?: string;
  body: string;
}

interface ActivityItem {
  id: string;
  text: React.ReactNode;
  time: string;
  tone: Tone;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  summary: string;
  sourceDetected: boolean;
  source?: string;
  details: { label: string; value: string }[];
  invoiceId?: string;
  client?: string;
  messagePreview?: ActivityMessagePreview;
}

const ACTIVITY_VISIBLE_COUNT = 10;
const ADD_EARNING_PREFILL = "I got paid in cash from Northstar Labs for $2,400 yesterday.";
const CASH_MATCH_CLIENT = "Northstar Labs";
const CASH_MATCH_INVOICE = "INV-1048";
const CASH_PAYMENT_ID = "due-1048";
const CASH_MATCH_AMOUNT = 2400;
const CASH_PROCESSING_MS = 4000;

const applyCashEarningStats = (
  kpis: { label: string; value: number; context: string; tone: Tone }[],
  chart: ChartMonth[]
) => ({
  kpis: kpis.map((k) => {
    if (k.label === "Paid this month") {
      return { ...k, value: k.value + CASH_MATCH_AMOUNT, context: "+15% vs last month" };
    }
    if (k.label === "Year-to-date earnings") {
      const value = k.value + CASH_MATCH_AMOUNT;
      return { ...k, value, context: `${Math.round((value / 200000) * 100)}% of annual goal` };
    }
    return k;
  }),
  chart: chart.map((m, i) =>
    i === chart.length - 1 ? { ...m, paid: m.paid + CASH_MATCH_AMOUNT } : m
  ),
});

const EarningsStatsCtx = React.createContext<{ kpis: typeof INITIAL_KPIS; chart: ChartMonth[] }>({
  kpis: INITIAL_KPIS,
  chart: INITIAL_CHART_ALL,
});
const useEarningsStats = () => React.useContext(EarningsStatsCtx);

const INITIAL_ACTIVITY: ActivityItem[] = [
  {
    id: "wise-atlas",
    text: (<>Payment detected via <b className="font-medium text-ink">Wise</b> from Atlas Creative</>),
    time: "Yesterday, 4:12 PM",
    tone: "green",
    icon: Wallet,
    title: "Payment detected",
    summary: "A $2,800 payment from Atlas Creative was matched automatically through your Wise connection.",
    sourceDetected: true,
    source: "Wise",
    client: "Atlas Creative",
    invoiceId: "INV-1042",
    details: [
      { label: "Amount", value: "$2,800" },
      { label: "Client", value: "Atlas Creative" },
      { label: "Matched to", value: "INV-1042" },
      { label: "Detected at", value: "Yesterday, 4:12 PM" },
    ],
  },
  {
    id: "whatsapp-bluebird",
    text: (<><b className="font-medium text-ink">Bluebird Studio</b> replied on WhatsApp to your reminder</>),
    time: "Yesterday, 11:48 AM",
    tone: "slate",
    icon: MessageCircle,
    title: "Client reply",
    summary: "Bluebird Studio responded on WhatsApp after your payment reminder for INV-1041.",
    sourceDetected: true,
    source: "WhatsApp",
    client: "Bluebird Studio",
    invoiceId: "INV-1041",
    details: [
      { label: "Client", value: "Bluebird Studio" },
      { label: "Channel", value: "WhatsApp" },
      { label: "Invoice", value: "INV-1041" },
      { label: "Received at", value: "Yesterday, 11:48 AM" },
    ],
    messagePreview: {
      channel: "WhatsApp",
      author: "Bluebird Studio",
      context: "Reply to your reminder",
      body: "Got it — we'll send payment for INV-1041 by Friday. Sorry for the delay!",
    },
  },
  {
    id: "sent-orbit-1052",
    text: (<>Invoice <b className="font-medium text-ink">INV-1052</b> sent to Orbit AI</>),
    time: "Jun 14, 2:30 PM",
    tone: "purple",
    icon: FileText,
    title: "Invoice sent",
    summary: "You sent INV-1052 to Orbit AI for $3,200. The client was notified by email.",
    sourceDetected: false,
    client: "Orbit AI",
    invoiceId: "INV-1052",
    details: [
      { label: "Invoice", value: "INV-1052" },
      { label: "Client", value: "Orbit AI" },
      { label: "Amount", value: "$3,200" },
      { label: "Sent at", value: "Jun 14, 2:30 PM" },
    ],
  },
  {
    id: "slack-orbit-1052",
    text: (<><b className="font-medium text-ink">Orbit AI</b> replied in Slack about INV-1052</>),
    time: "Jun 14, 4:05 PM",
    tone: "slate",
    icon: Slack,
    title: "Client reply",
    summary: "Orbit AI replied in your shared Slack channel confirming they will process INV-1052 this week.",
    sourceDetected: true,
    source: "Slack",
    client: "Orbit AI",
    invoiceId: "INV-1052",
    details: [
      { label: "Client", value: "Orbit AI" },
      { label: "Channel", value: "#orbit-finance" },
      { label: "Invoice", value: "INV-1052" },
      { label: "Received at", value: "Jun 14, 4:05 PM" },
    ],
    messagePreview: {
      channel: "Slack",
      author: "Orbit AI",
      context: "#orbit-finance",
      body: "Thanks for the ping — AP will process INV-1052 this week. Should land by Thursday.",
    },
  },
  {
    id: "viewed-northstar",
    text: (<><b className="font-medium text-ink">Northstar Labs</b> viewed invoice</>),
    time: "Jun 13, 6:48 PM",
    tone: "slate",
    icon: Eye,
    title: "Invoice viewed",
    summary: "Northstar Labs opened the payment link for INV-1055.",
    sourceDetected: false,
    client: "Northstar Labs",
    invoiceId: "INV-1055",
    details: [
      { label: "Client", value: "Northstar Labs" },
      { label: "Invoice", value: "INV-1055" },
      { label: "Amount", value: "$4,800" },
      { label: "Viewed at", value: "Jun 13, 6:48 PM" },
    ],
  },
  {
    id: "stripe-1037",
    text: (<>Payment matched to <b className="font-medium text-ink">INV-1037</b> via Stripe</>),
    time: "Jun 13, 4:12 PM",
    tone: "green",
    icon: GitMerge,
    title: "Payment matched",
    summary: "A Stripe payout was automatically matched to INV-1037 for Northstar Labs.",
    sourceDetected: true,
    source: "Stripe",
    client: "Northstar Labs",
    invoiceId: "INV-1037",
    details: [
      { label: "Invoice", value: "INV-1037" },
      { label: "Client", value: "Northstar Labs" },
      { label: "Amount", value: "$1,950" },
      { label: "Matched at", value: "Jun 13, 4:12 PM" },
    ],
  },
  {
    id: "email-northstar-1055",
    text: (<><b className="font-medium text-ink">Northstar Labs</b> replied by email about INV-1055</>),
    time: "Jun 13, 3:20 PM",
    tone: "slate",
    icon: Mail,
    title: "Client reply",
    summary: "Northstar Labs replied by email confirming accounts payable will review INV-1055.",
    sourceDetected: true,
    source: "Email",
    client: "Northstar Labs",
    invoiceId: "INV-1055",
    details: [
      { label: "Client", value: "Northstar Labs" },
      { label: "Channel", value: "Email" },
      { label: "Invoice", value: "INV-1055" },
      { label: "Received at", value: "Jun 13, 3:20 PM" },
    ],
    messagePreview: {
      channel: "Email",
      author: "Northstar Labs",
      context: "Re: Invoice INV-1055 — payment timing",
      body: "Hi Jordan,\n\nWe've received INV-1055 and AP will review it this week. Expect payment by end of month.\n\nBest,\nMorgan",
    },
  },
  {
    id: "due-1048",
    text: (<>Invoice <b className="font-medium text-ink">INV-1048</b> due tomorrow</>),
    time: "Jun 13, 10:00 AM",
    tone: "amber",
    icon: Clock,
    title: "Due soon",
    summary: "INV-1048 for Northstar Labs is due tomorrow. No payment has been recorded yet.",
    sourceDetected: false,
    client: "Northstar Labs",
    invoiceId: "INV-1048",
    details: [
      { label: "Invoice", value: "INV-1048" },
      { label: "Client", value: "Northstar Labs" },
      { label: "Amount", value: "$2,400" },
      { label: "Due", value: "Jun 17, 2026" },
    ],
  },
  {
    id: "overdue-bluebird",
    text: (<>Overdue alert for <b className="font-medium text-ink">Bluebird Studio</b></>),
    time: "Jun 12, 9:00 AM",
    tone: "red",
    icon: AlertTriangle,
    title: "Overdue alert",
    summary: "Bluebird Studio has $1,800 overdue across open invoices. A reminder is recommended.",
    sourceDetected: false,
    client: "Bluebird Studio",
    invoiceId: "INV-1041",
    details: [
      { label: "Client", value: "Bluebird Studio" },
      { label: "Overdue", value: "$1,800" },
      { label: "Open invoices", value: "INV-1041" },
      { label: "Alert at", value: "Jun 12, 9:00 AM" },
    ],
  },
  {
    id: "paypal-northstar",
    text: (<>Payment detected via <b className="font-medium text-ink">PayPal</b> from Northstar Labs</>),
    time: "Jun 11, 11:20 AM",
    tone: "green",
    icon: Banknote,
    title: "Payment detected",
    summary: "A $4,800 PayPal payment from Northstar Labs was detected and matched to INV-1055.",
    sourceDetected: true,
    source: "PayPal",
    client: "Northstar Labs",
    invoiceId: "INV-1055",
    details: [
      { label: "Amount", value: "$4,800" },
      { label: "Client", value: "Northstar Labs" },
      { label: "Matched to", value: "INV-1055" },
      { label: "Detected at", value: "Jun 11, 11:20 AM" },
    ],
  },
];

const buildCashProcessingActivity = (): ActivityItem => ({
  id: `cash-processing-${Date.now()}`,
  text: (<>Cash payment reported — wipOS is <b className="font-medium text-ink">matching sources</b></>),
  time: "Just now",
  tone: "slate",
  icon: CircleDashed,
  title: "Cash payment",
  summary: "Looking for a matching invoice, client record, and related WhatsApp or email threads.",
  sourceDetected: false,
  client: CASH_MATCH_CLIENT,
  details: [
    { label: "Amount", value: money(CASH_MATCH_AMOUNT) },
    { label: "Method", value: "Cash" },
    { label: "Status", value: "Processing" },
    { label: "Reported", value: "Just now" },
  ],
});

const buildCashMatchedActivity = (): ActivityItem => ({
  id: `cash-matched-${Date.now()}`,
  text: (<>Cash payment matched to <b className="font-medium text-ink">{CASH_MATCH_INVOICE}</b> for {CASH_MATCH_CLIENT}</>),
  time: "Just now",
  tone: "green",
  icon: GitMerge,
  title: "Match found",
  summary: `Matched your cash payment to ${CASH_MATCH_INVOICE} for ${CASH_MATCH_CLIENT}. Review and approve the findings.`,
  sourceDetected: true,
  source: "wipOS agent",
  client: CASH_MATCH_CLIENT,
  invoiceId: CASH_MATCH_INVOICE,
  details: [
    { label: "Invoice", value: CASH_MATCH_INVOICE },
    { label: "Client", value: CASH_MATCH_CLIENT },
    { label: "Amount", value: money(CASH_MATCH_AMOUNT) },
    { label: "Matched", value: "Just now" },
  ],
});

interface CashMatchFindings {
  client: string;
  invoiceId: string;
  amount: number;
  description: string;
  sources: { label: string; value: string }[];
}

const PipelineCtx = React.createContext<PipelineColumnData[]>(INITIAL_PIPELINE);
const ActivityCtx = React.createContext<ActivityItem[]>(INITIAL_ACTIVITY);
const AddEarningCtx = React.createContext<{ open: () => void; claimed: boolean }>({ open: () => {}, claimed: false });

const usePipeline = () => React.useContext(PipelineCtx);
const useActivities = () => React.useContext(ActivityCtx);
const useAddEarning = () => React.useContext(AddEarningCtx);

const CommandPaletteCtx = React.createContext<{ open: boolean; setOpen: (open: boolean) => void }>({
  open: false,
  setOpen: () => {},
});
const useCommandPalette = () => React.useContext(CommandPaletteCtx);

const useCommandShortcut = (setOpen: (open: boolean) => void) => {
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;
      event.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);
};

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
  processing: "slate",
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  due: "Due soon",
  expected: "Expected",
  overdue: "Overdue",
  paid: "Paid",
  processing: "Processing",
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
  status: InvoiceStatus;
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

const INITIAL_INVOICES: Record<string, Invoice> = {
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
  "INV-1042": {
    id: "INV-1042",
    client: "Atlas Creative",
    clientEmail: "hello@atlascreative.co",
    status: "paid",
    issued: "May 30, 2026",
    dueDate: "Jun 13, 2026",
    dueLabel: "Paid 4 days ago",
    paidDate: "Jun 13, 2026",
    amount: 2800,
    paymentMethod: "Wise",
    terms: "Net 14",
    lines: [
      { desc: "Brand guidelines — final delivery", qty: 1, unit: "project", rate: 2200, amount: 2200 },
      { desc: "Presentation deck design", qty: 4, unit: "hrs", rate: 150, amount: 600 },
    ],
    note: "Paid in full · Wise",
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

const STATUS_ORDER: Record<InvoiceStatus, number> = { overdue: 0, due: 1, expected: 2, paid: 3 };

const sortInvoiceList = (invoices: Record<string, Invoice>): Invoice[] =>
  Object.values(invoices).sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.amount - a.amount
  );

const clientInvoices = (invoices: Record<string, Invoice>, name: string): Invoice[] =>
  Object.values(invoices).filter((inv) => inv.client === name);

const clientInvoiceSubtitle = (invoices: Record<string, Invoice>, name: string): string => {
  const list = clientInvoices(invoices, name);
  if (list.length === 1) return list[0].id;
  return `${list.length} invoices`;
};

const clientOverdueTotal = (invoices: Record<string, Invoice>, name: string): number =>
  clientInvoices(invoices, name)
    .filter((inv) => inv.status === "overdue")
    .reduce((s, inv) => s + inv.amount, 0);

const InvoicesCtx = React.createContext<Record<string, Invoice>>(INITIAL_INVOICES);
const useInvoices = () => React.useContext(InvoicesCtx);

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
  status: InvoiceStatus;
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

const buildStoredReminder = (invoiceId: string, invoices: Record<string, Invoice>): SentReminder | undefined => {
  const invoice = invoices[invoiceId];
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

const TableSearchEmpty: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center px-6 py-10 text-center">
    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${ICON_WELL}`}>
      <SearchX size={20} strokeWidth={1.75} className="text-muted" aria-hidden="true" />
    </div>
    <p className="mt-3 max-w-[300px] text-[13px] leading-relaxed text-muted">{message}</p>
  </div>
);

const TableSearchField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}> = ({ value, onChange, placeholder }) => (
  <div className="relative min-w-0 flex-1 sm:max-w-sm">
    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-xl border border-line-strong bg-card py-2 pl-9 pr-9 text-[13px] text-ink ${INPUT_FOCUS}`}
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange("")}
        aria-label="Clear search"
        className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted transition hover:bg-hover hover:text-ink"
      >
        <CircleX size={15} strokeWidth={1.75} />
      </button>
    )}
  </div>
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

const SidebarSearch: React.FC = () => {
  const { setOpen } = useCommandPalette();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip="Search" onClick={() => setOpen(true)}>
        <Search />
        <span data-sidebar-label className="truncate group-data-[collapsible=icon]:hidden">
          Search
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

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
            <SidebarSearch />
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

const Header: React.FC = () => {
  const { open, claimed } = useAddEarning();
  return (
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
        <button
          onClick={open}
          disabled={claimed}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-fg shadow-lift transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={15} /> Add earning
        </button>
      </div>
    </div>
  </header>
  );
};

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
  const { chart } = useEarningsStats();
  const [range, setRange] = React.useState<ChartRange>(6);
  const data = chartSlice(chart, range);
  const insight = buildOnTrackInsight(chart, range);
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
  const isProcessing = item.status === "processing";
  const canRemind = !isProcessing && (item.status === "due" || item.status === "overdue" || item.status === "expected");
  const reminderSent = hasReminderSent(item.invoice, sentReminders);
  const reminderTarget = { client: item.client, invoice: item.invoice, amount: item.amount, statusLabel: item.due, status: item.status as InvoiceStatus };
  const btnBase = "inline-flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition";
  const btnNeutral = `${btnBase} border border-line-strong bg-card text-ink hover:bg-hover`;
  const btnPrimary = `${btnBase} bg-primary text-primary-fg hover:opacity-90`;

  if (isProcessing) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong bg-well-muted p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-semibold text-ink">{item.client}</div>
            <div className="mt-0.5 text-[12px] text-faint">Cash payment</div>
            <div className={`mt-0.5 text-[12px] font-medium ${TONE[tone].text}`}>{item.due}</div>
          </div>
          <div className="text-right text-[14px] font-semibold text-ink tnum">{money(item.amount)}</div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[12px] text-muted">
          <Loader2 size={14} className="shrink-0 animate-spin" />
          Matching invoice, client &amp; messages…
        </div>
      </div>
    );
  }

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

const PipelineColumn: React.FC<{ column: PipelineColumnData }> = ({ column }) => {
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
          <PaymentItemRow key={item.id} item={item} />
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

type InvoiceSortKey = "invoice" | "amount" | "due" | "status";
type SortDir = "asc" | "desc";
type InvoiceStatusFilter = InvoiceStatus | "all";

const INVOICE_STATUS_FILTERS: { key: InvoiceStatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "due", label: "Due soon" },
  { key: "expected", label: "Expected" },
  { key: "paid", label: "Paid" },
];

const invoiceSortValue = (invoice: Invoice, key: InvoiceSortKey): number | string => {
  if (key === "invoice") return invoice.id;
  if (key === "amount") return invoice.amount;
  if (key === "due") return new Date(invoice.dueDate).getTime();
  return STATUS_ORDER[invoice.status];
};

const SortableTh = <K extends string>({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  align = "left",
  className = "",
}: {
  label: string;
  sortKey: K;
  activeKey: K;
  dir: SortDir;
  onSort: (key: K) => void;
  align?: "left" | "right";
  className?: string;
}) => {
  const active = sortKey === activeKey;
  return (
    <th className={`px-4 pb-2 pt-4 font-medium ${align === "right" ? "text-right" : "text-left"} ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 uppercase tracking-wide transition ${
          active ? "text-ink" : "text-faint hover:text-muted"
        } ${align === "right" ? "ml-auto" : ""}`}
      >
        {label}
        {active ? (
          dir === "asc" ? <ArrowUp size={12} className="shrink-0" /> : <ArrowDown size={12} className="shrink-0" />
        ) : null}
      </button>
    </th>
  );
};

const InvoicesList: React.FC = () => {
  const invoices = useInvoices();
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<InvoiceStatusFilter>("all");
  const [sortKey, setSortKey] = React.useState<InvoiceSortKey>("status");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");

  const toggleSort = (key: InvoiceSortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "amount" || key === "due" ? "desc" : "asc");
    }
  };

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = sortInvoiceList(invoices).filter((invoice) => {
      if (statusFilter !== "all" && invoice.status !== statusFilter) return false;
      if (!q) return true;
      return (
        invoice.id.toLowerCase().includes(q) ||
        invoice.client.toLowerCase().includes(q) ||
        invoice.clientEmail.toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      const av = invoiceSortValue(a, sortKey);
      const bv = invoiceSortValue(b, sortKey);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [invoices, query, sortDir, sortKey, statusFilter]);

  return (
  <Card className="overflow-hidden">
    <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <TableSearchField
        value={query}
        onChange={setQuery}
        placeholder="Search invoices or clients…"
      />
      <div className="inline-flex shrink-0 flex-wrap rounded-xl border border-line bg-well-muted p-0.5">
        {INVOICE_STATUS_FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setStatusFilter(filter.key)}
            className={`rounded-[10px] px-2.5 py-1.5 text-[12px] font-medium transition whitespace-nowrap ${
              statusFilter === filter.key ? TAB_SELECTED : "text-muted hover:text-ink"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px]">
        <thead>
          <tr className="text-[11.5px]">
            <SortableTh
              label="Invoice"
              sortKey="invoice"
              activeKey={sortKey}
              dir={sortDir}
              onSort={toggleSort}
              className="pl-5 pr-4"
            />
            <SortableTh label="Amount" sortKey="amount" activeKey={sortKey} dir={sortDir} onSort={toggleSort} align="right" />
            <SortableTh label="Due" sortKey="due" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
            <SortableTh label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
            <th className="px-4 pb-2 pt-4 text-left text-[11.5px] font-medium uppercase tracking-wide text-faint">Terms</th>
            <th className="px-4 pb-2 pt-4 text-left text-[11.5px] font-medium uppercase tracking-wide text-faint">Payment method</th>
            <th className="px-4 pb-2 pt-4 text-left text-[11.5px] font-medium uppercase tracking-wide text-faint">Last reminder</th>
            <th className="pb-2 pt-4 pl-4 pr-5" aria-hidden="true" />
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((invoice) => <InvoiceRow key={invoice.id} invoice={invoice} />)
          ) : (
            <tr>
              <td colSpan={8}>
                <TableSearchEmpty message="No invoices match your search or filters." />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </Card>
  );
};

type PipelineView = "cards" | "list";

const PIPELINE_VIEWS: { key: PipelineView; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: "cards", label: "Cards", icon: LayoutGrid },
  { key: "list", label: "List", icon: List },
];

const PaymentPipelineSection: React.FC = () => {
  const [view, setView] = React.useState<PipelineView>("cards");
  const pipeline = usePipeline();

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
        <div
          className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${
            pipeline.some((col) => col.key === "processing" && col.items.length > 0) ? "xl:grid-cols-5" : "xl:grid-cols-4"
          }`}
        >
          {pipeline
            .filter((col) => col.key !== "processing" || col.items.length > 0)
            .map((col) => (
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

const ActivityRow: React.FC<{ item: ActivityItem; isLast: boolean; onSelect: () => void }> = ({ item, isLast, onSelect }) => (
  <li className="flex gap-5">
    <div className="flex w-5 shrink-0 flex-col items-center pt-1.5" aria-hidden="true">
      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${TONE[item.tone].bg} ${TONE[item.tone].text}`}>
        <item.icon size={11} />
      </span>
      {!isLast && <div className="my-2 w-px min-h-[14px] flex-1 bg-line" />}
    </div>
    <button
      type="button"
      onClick={onSelect}
      className={`group -mr-1 flex-1 rounded-xl px-2.5 py-1.5 text-left transition hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isLast ? "" : "pb-5"}`}
    >
      <p className="text-[13px] leading-snug text-muted transition-colors group-hover:text-ink">{item.text}</p>
      <p className="mt-1 text-[11.5px] text-faint">{item.time}</p>
    </button>
  </li>
);

const ActivityMessagePreviewBlock: React.FC<{ preview: ActivityMessagePreview }> = ({ preview }) => (
  <div className="overflow-hidden rounded-xl border border-line bg-well-muted">
    <div className="border-b border-line px-4 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-[12.5px] font-medium text-ink">{preview.author}</span>
        <span className="shrink-0 text-[11.5px] text-faint">{preview.channel}</span>
      </div>
      {preview.context && (
        <div className="mt-0.5 truncate text-[12px] text-muted">{preview.context}</div>
      )}
    </div>
    <div className="whitespace-pre-wrap px-4 py-3.5 text-[13.5px] leading-relaxed text-ink">{preview.body}</div>
  </div>
);

const ActivityDetailModal: React.FC<{ item: ActivityItem; onClose: () => void }> = ({ item, onClose }) => {
  const openInvoice = useOpenInvoice();
  const [reported, setReported] = useState(false);

  const tone = TONE[item.tone];

  return (
    <ModalFrame onClose={onClose} ariaLabel={item.title} dialogClassName="max-w-[600px]">
      {(dismiss) => (
        <>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-3">
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone.bg} ${tone.text}`}>
              <item.icon size={16} />
            </span>
            <div className="min-w-0 space-y-0.5 pr-2">
              <p className="text-[15px] font-semibold tracking-tight text-muted [&_b]:font-semibold [&_b]:text-ink">{item.text}</p>
              <div className="text-[12px] text-faint">{item.time}</div>
            </div>
          </div>
          <button
            onClick={() => dismiss()}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-hover hover:text-ink"
          >
            <X size={17} />
          </button>
        </div>

        <div className="modal-scroll flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {item.sourceDetected && item.source && (
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-well-muted px-3 py-1 text-[12px] text-muted">
              <Waypoints size={13} className="text-faint" />
              Detected via {item.source}
            </div>
          )}
          <p className="text-[13.5px] leading-relaxed text-muted">{item.summary}</p>
          {item.messagePreview && (
            <div>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-faint">Message preview</div>
              <ActivityMessagePreviewBlock preview={item.messagePreview} />
            </div>
          )}
          <dl className="divide-y divide-line rounded-2xl border border-line">
            {item.details.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-4 px-4 py-3">
                <dt className="text-[12px] text-faint">{row.label}</dt>
                <dd className="text-right text-[13px] font-medium text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
          {item.sourceDetected ? (
            reported ? (
              <p className="text-[12.5px] text-muted">Thanks — we&apos;ll review this.</p>
            ) : (
              <button
                type="button"
                onClick={() => setReported(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12.5px] font-medium text-muted transition hover:bg-hover hover:text-ink"
              >
                <Flag size={14} />
                Report a mistake
              </button>
            )
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {item.invoiceId && (
              <button
                type="button"
                onClick={() => {
                  openInvoice(item.invoiceId!);
                  dismiss({ instant: true });
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-card px-3.5 py-2 text-[13px] font-medium text-ink transition hover:bg-hover"
              >
                View invoice
              </button>
            )}
            <button
              type="button"
              onClick={() => dismiss()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-fg transition hover:opacity-90"
            >
              Done
            </button>
          </div>
        </div>
        </>
      )}
    </ModalFrame>
  );
};

const RecentActivity: React.FC = () => {
  const [selected, setSelected] = useState<ActivityItem | null>(null);
  const activities = useActivities();

  return (
    <>
      <Card className="flex h-full w-full flex-col p-5 md:p-6">
        <SectionTitle
          title="Recent activity"
          right={
            <button className="hidden w-fit items-center gap-1.5 rounded-lg border border-line-strong bg-card px-2.5 py-1.5 text-[12.5px] font-medium text-ink transition hover:bg-hover sm:inline-flex">
              See all
            </button>
          }
        />
        <ol className="mt-1">
          {activities.map((a, i) => (
            <ActivityRow key={a.id} item={a} isLast={i === activities.length - 1} onSelect={() => setSelected(a)} />
          ))}
        </ol>
      </Card>
      {selected && <ActivityDetailModal item={selected} onClose={() => setSelected(null)} />}
    </>
  );
};

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
  const invoices = useInvoices();
  const overdue = clientOverdueTotal(invoices, client.name);
  return (
  <tr className="border-t border-line transition hover:bg-hover">
    <td className="py-3.5 pl-5 pr-4">
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium text-ink">{client.name}</div>
        <div className="mt-0.5 truncate text-[12px] text-faint">{clientInvoiceSubtitle(invoices, client.name)}</div>
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

type ClientSortKey = "client" | "revenue" | "overdue" | "avgDays" | "reliability";

const RELIABILITY_ORDER: Record<Reliability, number> = {
  Reliable: 0,
  "Usually late": 1,
  "At risk": 2,
  "New client": 3,
};

const CLIENT_RELIABILITY_FILTERS: { key: Reliability | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "Reliable", label: "Reliable" },
  { key: "Usually late", label: "Usually late" },
  { key: "At risk", label: "At risk" },
  { key: "New client", label: "New client" },
];

const clientSortValue = (invoices: Record<string, Invoice>, client: Client, key: ClientSortKey): number | string => {
  if (key === "client") return client.name;
  if (key === "revenue") return client.revenue;
  if (key === "overdue") return clientOverdueTotal(invoices, client.name);
  if (key === "avgDays") return client.avgDays;
  return RELIABILITY_ORDER[client.reliability];
};

const TopClientsSection: React.FC = () => {
  const invoices = useInvoices();
  const { notes } = useClientNotes();
  const [query, setQuery] = React.useState("");
  const [reliabilityFilter, setReliabilityFilter] = React.useState<Reliability | "all">("all");
  const [sortKey, setSortKey] = React.useState<ClientSortKey>("revenue");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const toggleSort = (key: ClientSortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "client" || key === "reliability" ? "asc" : "desc");
    }
  };

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = CLIENTS.filter((client) => {
      if (reliabilityFilter !== "all" && client.reliability !== reliabilityFilter) return false;
      if (!q) return true;
      const note = notes[client.name] ?? INITIAL_CLIENT_NOTES[client.name] ?? "";
      return (
        client.name.toLowerCase().includes(q) ||
        client.insight.toLowerCase().includes(q) ||
        note.toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      const av = clientSortValue(invoices, a, sortKey);
      const bv = clientSortValue(invoices, b, sortKey);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [invoices, notes, query, reliabilityFilter, sortDir, sortKey]);

  return (
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
      <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <TableSearchField
          value={query}
          onChange={setQuery}
          placeholder="Search clients, insights, or notes…"
        />
        <div className="inline-flex shrink-0 flex-wrap rounded-xl border border-line bg-well-muted p-0.5">
          {CLIENT_RELIABILITY_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setReliabilityFilter(filter.key)}
              className={`rounded-[10px] px-2.5 py-1.5 text-[12px] font-medium transition whitespace-nowrap ${
                reliabilityFilter === filter.key ? TAB_SELECTED : "text-muted hover:text-ink"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px]">
          <thead>
            <tr className="text-[11.5px]">
              <SortableTh
                label="Client"
                sortKey="client"
                activeKey={sortKey}
                dir={sortDir}
                onSort={toggleSort}
                className="pl-5 pr-4"
              />
              <SortableTh
                label="Revenue this year"
                sortKey="revenue"
                activeKey={sortKey}
                dir={sortDir}
                onSort={toggleSort}
                align="right"
              />
              <SortableTh
                label="Overdue invoices"
                sortKey="overdue"
                activeKey={sortKey}
                dir={sortDir}
                onSort={toggleSort}
                align="right"
              />
              <SortableTh
                label="Avg. days to pay"
                sortKey="avgDays"
                activeKey={sortKey}
                dir={sortDir}
                onSort={toggleSort}
                align="right"
              />
              <th className="px-4 pb-2 pt-4 text-left text-[11.5px] font-medium uppercase tracking-wide text-faint">
                <span className="inline-flex items-center gap-1.5">
                  Insights
                  <Sparkle size={12} className="text-faint" />
                </span>
              </th>
              <SortableTh
                label="Reliability"
                sortKey="reliability"
                activeKey={sortKey}
                dir={sortDir}
                onSort={toggleSort}
                align="right"
              />
              <th className="pb-2 pt-4 pl-4 pr-5 text-left text-[11.5px] font-medium uppercase tracking-wide text-faint">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((c) => <ClientRow key={c.name} client={c} />)
            ) : (
              <tr>
                <td colSpan={7}>
                  <TableSearchEmpty message="No clients match your search or filters." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  </section>
  );
};

/* ---------------------------- modal shell ---------------------------- */

type ModalStackApi = {
  count: number;
  register: () => () => void;
  beginOverlayExit: () => void;
};

type OverlayPhase = "hidden" | "enter" | "visible" | "exit";

type ModalDismissOptions = { instant?: boolean };
type ModalDismiss = (options?: ModalDismissOptions) => void;

const ModalStackCtx = React.createContext<ModalStackApi>({
  count: 0,
  register: () => () => {},
  beginOverlayExit: () => {},
});

const ModalDismissCtx = React.createContext<ModalDismiss>(() => {});

const OVERLAY_MS = 150;
const DIALOG_MS = 180;
const MODAL_SHELL = "fixed inset-0 z-[51] flex items-end justify-center sm:items-center sm:p-4";
const MODAL_SHELL_TOP = "fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4";
const DIALOG_BASE = "flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-card shadow-lift sm:rounded-3xl";
const DIALOG_IN = "animate-[dialogIn_180ms_ease-out]";
const DIALOG_OUT = "animate-[dialogOut_180ms_ease-in_forwards]";

const ModalStackProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [count, setCount] = React.useState(0);
  const [phase, setPhase] = React.useState<OverlayPhase>("hidden");
  const prevCount = React.useRef(0);
  const hideTimer = React.useRef<number | null>(null);

  const register = React.useCallback(() => {
    setCount((c) => c + 1);
    return () => setCount((c) => c - 1);
  }, []);

  const beginOverlayExit = React.useCallback(() => {
    setPhase("exit");
  }, []);

  React.useEffect(() => {
    const prev = prevCount.current;
    prevCount.current = count;

    if (count > 0 && prev === 0) {
      setPhase("enter");
    } else if (count === 0 && prev > 0) {
      const alreadyExiting = phase === "exit";
      if (!alreadyExiting) setPhase("exit");
      if (hideTimer.current != null) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setPhase("hidden"), alreadyExiting ? 0 : OVERLAY_MS);
    }
  }, [count, phase]);

  React.useEffect(() => {
    if (phase !== "enter") return;
    const t = window.setTimeout(() => setPhase("visible"), OVERLAY_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  React.useEffect(
    () => () => {
      if (hideTimer.current != null) window.clearTimeout(hideTimer.current);
    },
    []
  );

  const showOverlay = phase !== "hidden";
  const overlayAnim =
    phase === "enter" ? "animate-[overlayIn_150ms_ease-out]" : phase === "exit" ? "animate-[overlayOut_150ms_ease-in_forwards]" : "";

  React.useEffect(() => {
    if (count === 0) return;

    const lockedY = window.scrollY;
    const scrollRoot = document.documentElement;

    const inModalScroll = (target: EventTarget | null) =>
      target instanceof Element && !!target.closest('[role="dialog"] .modal-scroll');

    const inTextEntry = (target: EventTarget | null) =>
      target instanceof Element &&
      !!target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]');

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
      if (inTextEntry(e.target)) return;
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
  }, [count > 0]);

  return (
    <ModalStackCtx.Provider value={{ count, register, beginOverlayExit }}>
      {children}
      {showOverlay &&
        createPortal(
          <div
            aria-hidden="true"
            className={`pointer-events-none fixed inset-0 z-50 bg-black/30 backdrop-blur-sm ${overlayAnim}`}
          />,
          document.body
        )}
    </ModalStackCtx.Provider>
  );
};

const useModalDismiss = () => React.useContext(ModalDismissCtx);

const ModalFrame: React.FC<{
  onClose: () => void;
  shellClass?: string;
  ariaLabel: string;
  dialogClassName?: string;
  children: React.ReactNode | ((dismiss: ModalDismiss) => React.ReactNode);
}> = ({ onClose, shellClass = MODAL_SHELL, ariaLabel, dialogClassName = "", children }) => {
  const { count, register, beginOverlayExit } = React.useContext(ModalStackCtx);
  const [closing, setClosing] = React.useState(false);
  const closeTimer = React.useRef<number | null>(null);

  React.useEffect(() => register(), [register]);

  React.useEffect(
    () => () => {
      if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    },
    []
  );

  const dismiss = React.useCallback<ModalDismiss>(
    (options) => {
      if (closing) return;
      if (options?.instant) {
        onClose();
        return;
      }
      if (count === 1) beginOverlayExit();
      setClosing(true);
      closeTimer.current = window.setTimeout(onClose, DIALOG_MS);
    },
    [beginOverlayExit, closing, count, onClose]
  );

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dismiss]);

  const body = typeof children === "function" ? children(dismiss) : children;

  return (
    <ModalDismissCtx.Provider value={dismiss}>
      <div onClick={() => dismiss()} className={shellClass}>
        <div
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          className={`${DIALOG_BASE} ${closing ? DIALOG_OUT : DIALOG_IN} ${dialogClassName}`}
        >
          {body}
        </div>
      </div>
    </ModalDismissCtx.Provider>
  );
};

/* ---------------------------- invoice preview ---------------------------- */

const InvoicePreview: React.FC<{ invoice: Invoice; onClose: () => void }> = ({ invoice, onClose }) => {
  const openReminder = useOpenReminder();

  const tone = STATUS_TONE[invoice.status];
  const subtotal = invoice.lines.reduce((s, l) => s + l.amount, 0);
  const primaryLabel = invoice.status === "paid" ? "Download receipt" : "Send reminder";

  return (
    <ModalFrame onClose={onClose} ariaLabel={"Invoice " + invoice.id} dialogClassName="max-w-[560px]">
      {(dismiss) => {
        const onPrimary =
          primaryLabel === "Send reminder"
            ? () => {
                openReminder({ client: invoice.client, invoice: invoice.id, amount: invoice.amount, statusLabel: invoice.dueLabel, status: invoice.status });
                dismiss({ instant: true });
              }
            : undefined;

        return (
        <>
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
            {invoice.status !== "overdue" && invoice.status !== "paid" && <StatusPill tone="slate" label="Viewed" dot={false} />}
            <button
              onClick={() => dismiss()}
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
        </>
        );
      }}
    </ModalFrame>
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
  const [sending, setSending] = useState(false);
  const sendTimer = React.useRef<number | null>(null);

  React.useEffect(() => () => {
    if (sendTimer.current != null) window.clearTimeout(sendTimer.current);
  }, []);

  const firstRun = React.useRef(true);
  React.useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setMessage(buildMessage(target, voice));
  }, [voice, target]);

  const active = CHANNELS.find((c) => c.key === channel) as Channel;
  const isEmail = channel === "email";
  const showPdfToggle = channelAttachesPdf(channel);
  const seenAt = React.useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - 2);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }, []);

  const handleSend = () => {
    if (sending) return;
    setSending(true);
    sendTimer.current = window.setTimeout(() => {
      onSent?.({ target, channel, voice, message, subject, includeLink, attachPdf, copyMe });
      setSent(true);
      setSending(false);
    }, 1500);
  };

  return (
    <ModalFrame
      onClose={onClose}
      shellClass={MODAL_SHELL_TOP}
      ariaLabel={"Send reminder to " + target.client}
      dialogClassName="max-w-[560px]"
    >
      {(dismiss) => (
        <>
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
                onClick={() => dismiss()}
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
                onClick={() => dismiss()}
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
                  onClick={() => dismiss()}
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
                <button onClick={() => dismiss()} className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-card px-3.5 py-2 text-[13px] font-medium text-ink transition hover:bg-hover">
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-fg transition hover:opacity-90 disabled:cursor-wait disabled:opacity-90"
                >
                  {sending ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <active.icon size={15} /> Send via {active.label}
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
        </>
      )}
    </ModalFrame>
  );
};

/* ---------------------------- add earning ---------------------------- */

const useTypingPrefill = (fullText: string, active: boolean, speed = 28, delay = 0) => {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);

  React.useEffect(() => {
    if (!active) {
      setText("");
      setDone(false);
      return;
    }
    setText("");
    setDone(false);
    let i = 0;
    let interval: number | null = null;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        i += 1;
        setText(fullText.slice(0, i));
        if (i >= fullText.length) {
          if (interval != null) window.clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, delay);
    return () => {
      window.clearTimeout(start);
      if (interval != null) window.clearInterval(interval);
    };
  }, [active, fullText, speed, delay]);

  return { text, done };
};

const AddEarningModal: React.FC<{
  onClose: () => void;
  onProcess: (description: string, complete: (findings: CashMatchFindings) => void) => void;
}> = ({ onClose, onProcess }) => {
  const { text: typed, done: typingDone } = useTypingPrefill(ADD_EARNING_PREFILL, true, 28, 2000);
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [findings, setFindings] = useState<CashMatchFindings | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (typingDone) setMessage(ADD_EARNING_PREFILL);
  }, [typingDone]);

  const displayText = typingDone ? message : typed;
  const canSubmit = typingDone && message.trim().length > 0 && !submitting;
  const matched = !!findings;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    onProcess(message.trim(), (result) => {
      setFindings(result);
      setSubmitting(false);
    });
  };

  return (
    <ModalFrame onClose={onClose} ariaLabel={matched ? "Approve match findings" : "Add earning"} dialogClassName="max-w-[560px]">
      {(dismiss) =>
        matched && findings ? (
          <>
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${TONE.green.bg} ${TONE.green.text}`}>
                  <GitMerge size={16} />
                </span>
                <div>
                  <div className="text-[15px] font-semibold tracking-tight text-ink">Match ready for approval</div>
                  <div className="text-[12px] text-faint">
                    {findings.client} · {findings.invoiceId}
                  </div>
                </div>
              </div>
              <button
                onClick={() => dismiss()}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-hover hover:text-ink"
              >
                <X size={17} />
              </button>
            </div>

            <div className="modal-scroll flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-line bg-well-muted px-3 py-1 text-[12px] text-muted">
                <Sparkle size={13} className="text-faint" />
                Findings from invoices, clients &amp; messages
              </div>
              <p className="text-[13.5px] leading-relaxed text-muted">
                wipOS matched your cash payment to <span className="font-medium text-ink">{findings.invoiceId}</span> for{" "}
                <span className="font-medium text-ink">{findings.client}</span> ({money(findings.amount)}).
              </p>
              <div className="rounded-xl border border-line bg-well-muted px-3.5 py-3 text-[13px] leading-relaxed text-muted">
                &ldquo;{findings.description}&rdquo;
              </div>
              <dl className="divide-y divide-line rounded-2xl border border-line">
                {findings.sources.map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-4 px-4 py-3">
                    <dt className="text-[12px] text-faint">{row.label}</dt>
                    <dd className="text-right text-[13px] font-medium text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
              <button
                type="button"
                onClick={() => dismiss()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-card px-3.5 py-2 text-[13px] font-medium text-ink transition hover:bg-hover"
              >
                Match manually
              </button>
              <button
                type="button"
                onClick={() => dismiss()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-fg transition hover:opacity-90"
              >
                <CheckCircle2 size={15} /> Approve match
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${ICON_WELL}`}>
                  <Sparkle size={16} />
                </span>
                <div>
                  <div className="text-[15px] font-semibold tracking-tight text-ink">Add earning</div>
                  <div className="text-[12px] text-faint">Describe what you received — wipOS will match it</div>
                </div>
              </div>
              <button
                onClick={() => dismiss()}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-hover hover:text-ink"
              >
                <X size={17} />
              </button>
            </div>

            <div className="modal-scroll flex-1 space-y-4 overflow-y-auto p-6">
              <div className={`overflow-hidden rounded-xl border border-line-strong bg-card transition focus-within:border-line-strong focus-within:ring-2 focus-within:ring-ring`}>
                <textarea
                  value={displayText}
                  onChange={(e) => typingDone && setMessage(e.target.value)}
                  rows={5}
                  readOnly={!typingDone || submitting}
                  placeholder="Tell wipOS what you received…"
                  className={`w-full resize-none border-0 bg-transparent px-3.5 py-3 text-[14px] leading-relaxed text-ink outline-none placeholder:text-faint ${!typingDone ? "caret-transparent" : ""}`}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2">
                    <div className="flex items-center gap-1">
                      <input
                        ref={fileRef}
                        type="file"
                        className="hidden"
                        disabled={submitting}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setAttachment(file.name);
                        }}
                      />
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => fileRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-muted transition hover:bg-hover hover:text-ink disabled:opacity-40"
                      >
                        <Paperclip size={14} /> Attach
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => setRecording((r) => !r)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition disabled:opacity-40 ${
                          recording ? "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400" : "text-muted hover:bg-hover hover:text-ink"
                        }`}
                      >
                        <Mic size={14} /> {recording ? "Listening…" : "Voice"}
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={!canSubmit}
                      onClick={handleSubmit}
                      aria-label={submitting ? "Processing" : "Submit earning"}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {submitting ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <ArrowUp size={16} strokeWidth={2.25} />
                      )}
                    </button>
                  </div>
              </div>

              {attachment && (
                <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-well-muted px-3 py-2 text-[12.5px]">
                  <Paperclip size={14} className="text-muted" />
                  <span className="font-medium text-ink">{attachment}</span>
                  <button type="button" disabled={submitting} onClick={() => setAttachment(null)} className="text-faint hover:text-ink disabled:opacity-40">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </>
        )
      }
    </ModalFrame>
  );
};

/* ---------------------------- command menu ---------------------------- */

const BLUEBIRD_REMINDER: ReminderTarget = {
  client: "Bluebird Studio",
  invoice: "INV-1041",
  amount: 1900,
  statusLabel: "Overdue 12 days",
  status: "overdue",
};

const COMMAND_INVOICES: { id: string; client: string; hint: string }[] = [
  { id: "INV-1048", client: "Northstar Labs", hint: "Due this week" },
  { id: "INV-1041", client: "Bluebird Studio", hint: "Overdue 12 days" },
  { id: "INV-1039", client: "Bluebird Studio", hint: "Overdue 21 days" },
  { id: "INV-1052", client: "Orbit AI", hint: "Expected Jun 28" },
  { id: "INV-1042", client: "Atlas Creative", hint: "Paid" },
];

const CommandMenu: React.FC = () => {
  const { open, setOpen } = useCommandPalette();
  const { open: openAddEarning, claimed } = useAddEarning();
  const openInvoice = useOpenInvoice();
  const openReminder = useOpenReminder();
  const { theme, toggleTheme } = useTheme();
  const { toggleSidebar } = useSidebar();

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search actions, invoices, pages…" />
      <CommandList>
        <CommandEmpty>No matches found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem
            value="report income add earning cash payment"
            disabled={claimed}
            onSelect={() => run(openAddEarning)}
          >
            <Plus />
            <span>Report income</span>
            <CommandShortcut>Add earning</CommandShortcut>
          </CommandItem>
          <CommandItem value="export report earnings csv" onSelect={() => run(() => {})}>
            <Download />
            <span>Export earnings report</span>
          </CommandItem>
          <CommandItem
            value="send reminder bluebird studio overdue inv-1041"
            onSelect={() => run(() => openReminder(BLUEBIRD_REMINDER))}
          >
            <Send />
            <span>Send reminder · Bluebird Studio</span>
            <CommandShortcut>INV-1041</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="toggle appearance dark light theme"
            onSelect={() => run(toggleTheme)}
          >
            <Eclipse />
            <span>{theme === "light" ? "Switch to dark mode" : "Switch to light mode"}</span>
          </CommandItem>
          <CommandItem value="toggle sidebar navigation" onSelect={() => run(toggleSidebar)}>
            <PanelLeft />
            <span>Toggle sidebar</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Invoices">
          {COMMAND_INVOICES.map((inv) => (
            <CommandItem
              key={inv.id}
              value={`view invoice ${inv.id} ${inv.client} ${inv.hint}`}
              onSelect={() => run(() => openInvoice(inv.id))}
            >
              <FileText />
              <span>
                {inv.id} · {inv.client}
              </span>
              <CommandShortcut>{inv.hint}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {SIDEBAR_NAV.map((item) => (
            <CommandItem
              key={item.label}
              value={`go to ${item.label} page navigation`}
              onSelect={() => run(() => {})}
            >
              <item.icon />
              <span>{item.label}</span>
              {"active" in item && item.active ? <CommandShortcut>Current</CommandShortcut> : null}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          {SIDEBAR_FOOTER_NAV.map((item) => (
            <CommandItem
              key={item.label}
              value={`${item.label} settings`}
              onSelect={() => run(() => {})}
            >
              <item.icon />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

/* ---------------------------- dashboard ---------------------------- */

const Dashboard: React.FC = () => {
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [reminder, setReminder] = useState<{ target: ReminderTarget; view: boolean } | null>(null);
  const [sentReminders, setSentReminders] = useState<Record<string, SentReminder>>({});
  const [clientNotes, setClientNotes] = useState<Record<string, string>>(INITIAL_CLIENT_NOTES);
  const [pipeline, setPipeline] = useState<PipelineColumnData[]>(INITIAL_PIPELINE);
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITY);
  const [invoices, setInvoices] = useState<Record<string, Invoice>>(INITIAL_INVOICES);
  const [showAddEarning, setShowAddEarning] = useState(false);
  const [cashEarningClaimed, setCashEarningClaimed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [earningsStats, setEarningsStats] = useState({
    kpis: INITIAL_KPIS,
    chart: INITIAL_CHART_ALL,
  });
  const processingTimer = React.useRef<number | null>(null);
  const invoice = invoiceId ? invoices[invoiceId] : null;

  useCommandShortcut(setCommandOpen);

  React.useEffect(
    () => () => {
      if (processingTimer.current != null) window.clearTimeout(processingTimer.current);
    },
    []
  );

  const prependActivity = React.useCallback((item: ActivityItem) => {
    setActivities((prev) => [item, ...prev].slice(0, ACTIVITY_VISIBLE_COUNT));
  }, []);

  const processEarning = React.useCallback(
    (description: string, complete: (findings: CashMatchFindings) => void) => {
      if (cashEarningClaimed) return;

      setCashEarningClaimed(true);

      const processingPayment: Payment = {
        id: CASH_PAYMENT_ID,
        client: CASH_MATCH_CLIENT,
        invoice: CASH_MATCH_INVOICE,
        amount: CASH_MATCH_AMOUNT,
        due: "Matching invoice & client…",
        status: "processing",
      };

      setPipeline((prev) =>
        prev.map((col) => {
          if (col.key === "due") {
            return { ...col, items: col.items.filter((p) => p.id !== CASH_PAYMENT_ID) };
          }
          if (col.key === "processing") {
            return { ...col, items: [processingPayment] };
          }
          return col;
        })
      );
      prependActivity(buildCashProcessingActivity());

      if (processingTimer.current != null) window.clearTimeout(processingTimer.current);
      processingTimer.current = window.setTimeout(() => {
        setPipeline((prev) =>
          prev.map((col) => {
            if (col.key === "processing") {
              return { ...col, items: [] };
            }
            if (col.key === "paid") {
              return {
                ...col,
                items: [
                  {
                    id: CASH_PAYMENT_ID,
                    client: CASH_MATCH_CLIENT,
                    invoice: CASH_MATCH_INVOICE,
                    amount: CASH_MATCH_AMOUNT,
                    due: "Paid just now",
                    status: "paid",
                    action: { label: "View", icon: Eye },
                  },
                  ...col.items.filter((p) => p.id !== CASH_PAYMENT_ID),
                ],
              };
            }
            return col;
          })
        );
        prependActivity(buildCashMatchedActivity());
        setInvoices((prev) => ({
          ...prev,
          [CASH_MATCH_INVOICE]: {
            ...prev[CASH_MATCH_INVOICE],
            status: "paid",
            paidDate: "Jun 17, 2026",
            dueLabel: "Paid just now",
            paymentMethod: "Cash",
            note: "Paid in full · Cash",
          },
        }));
        setEarningsStats((prev) => applyCashEarningStats(prev.kpis, prev.chart));
        complete({
          client: CASH_MATCH_CLIENT,
          invoiceId: CASH_MATCH_INVOICE,
          amount: CASH_MATCH_AMOUNT,
          description,
          sources: [
            { label: "Invoice", value: `${CASH_MATCH_INVOICE} · ${money(CASH_MATCH_AMOUNT)} due` },
            { label: "Client", value: CASH_MATCH_CLIENT },
            { label: "WhatsApp", value: "Jun 12 — \"Sending wire tomorrow\"" },
          ],
        });
      }, CASH_PROCESSING_MS);
    },
    [cashEarningClaimed, prependActivity]
  );

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
    <CommandPaletteCtx.Provider value={{ open: commandOpen, setOpen: setCommandOpen }}>
    <ThemeProvider>
    <ModalStackProvider>
    <InvoicesCtx.Provider value={invoices}>
    <EarningsStatsCtx.Provider value={earningsStats}>
    <PipelineCtx.Provider value={pipeline}>
    <ActivityCtx.Provider value={activities}>
    <AddEarningCtx.Provider value={{ open: () => { if (!cashEarningClaimed) setShowAddEarning(true); }, claimed: cashEarningClaimed }}>
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
          {earningsStats.kpis.map((k) => (
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
        {showAddEarning && (
          <AddEarningModal onClose={() => setShowAddEarning(false)} onProcess={processEarning} />
        )}
        {reminder && (
          <ReminderModal
            target={reminder.target}
            startInReceipt={reminder.view}
            initial={sentReminders[reminder.target.invoice] ?? buildStoredReminder(reminder.target.invoice, invoices)}
            onSent={recordReminder}
            onClose={() => setReminder(null)}
          />
        )}
        <CommandMenu />
      </SidebarInset>
    </SidebarProvider>
    </ClientNotesCtx.Provider>
    </ReminderCtx.Provider>
    </SentRemindersCtx.Provider>
    </InvoiceCtx.Provider>
    </AddEarningCtx.Provider>
    </ActivityCtx.Provider>
    </PipelineCtx.Provider>
    </EarningsStatsCtx.Provider>
    </InvoicesCtx.Provider>
    </ModalStackProvider>
    </ThemeProvider>
    </CommandPaletteCtx.Provider>
  );
};

createRoot(document.getElementById("root")!).render(<Dashboard />);
