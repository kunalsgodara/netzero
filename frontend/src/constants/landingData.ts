import {
  Activity, ShieldCheck, Users, Award, FileText, Sparkles,
  Database, LineChart, CheckCircle2,
} from "lucide-react"
import type { ElementType } from "react"

export const BAR_HEIGHTS: number[] = [55, 70, 48, 82, 65, 90, 44, 96, 58, 78, 62, 88]

export interface FeatureCard {
  icon: ElementType;
  title: string;
  desc: string;
}

export const FEATURES: FeatureCard[] = [
  {
    icon: Activity,
    title: "Scope 1, 2 & 3 Tracking",
    desc: "Log every emission source with GHG Protocol-aligned categories. Automatic tCO₂e calculations per activity and reporting period.",
  },
  {
    icon: ShieldCheck,
    title: "CBAM Compliance",
    desc: "Calculate embedded emissions per installation, manage CN codes, apply phase-in rates, and generate EU-ready quarterly declarations.",
  },
  {
    icon: Users,
    title: "Supplier Portal",
    desc: "Invite non-EU suppliers to submit their own installation emissions data. Track verification status and data requests automatically.",
  },
  {
    icon: Award,
    title: "Certificate Management",
    desc: "Track CBAM certificate holdings vs obligations per quarter. Monitor your 30 Sep 2027 surrender deadline with real-time alerts.",
  },
  {
    icon: FileText,
    title: "SECR & CBAM Reports",
    desc: "One-click PDF exports for mandatory UK SECR filings and EU CBAM quarterly declarations. Audit-trail ready.",
  },
  {
    icon: Sparkles,
    title: "AI Reduction Insights",
    desc: "Gemini-powered recommendations ranked by impact and cost. Identify your biggest reduction opportunities instantly.",
  },
]

export interface StepCard {
  icon: ElementType;
  num: string;
  title: string;
  desc: string;
}

export const STEPS: StepCard[] = [
  {
    icon: Database,
    num: "01",
    title: "Connect & Log",
    desc: "Enter your energy, fuel, and import data. CN codes, installation IDs and Scope 1, 2 & 3 emission factors are applied automatically.",
  },
  {
    icon: LineChart,
    num: "02",
    title: "Analyse & Comply",
    desc: "Dashboard aggregates your CBAM liability, embedded emissions, and certificate obligations in real time per EU taxonomy.",
  },
  {
    icon: FileText,
    num: "03",
    title: "Declare & Reduce",
    desc: "Export CBAM declarations and SECR-ready PDFs. Follow AI recommendations and manage supplier data to lower your carbon liability.",
  },
]

export interface CBAMPhase {
  year: string;
  label: string;
  status: 'active' | 'done' | 'future';
  desc: string;
}

export const CBAM_PHASES: CBAMPhase[] = [
  {
    year: "2023–24",
    label: "Transitional Phase",
    status: "done",
    desc: "Reporting-only. Quarterly embedded-emissions data required. No financial penalties yet.",
  },
  {
    year: "2025–26",
    label: "Full Liability",
    status: "active",
    desc: "CBAM certificates required. 31 Mar 2026 declarant deadline. Financial penalties now apply to all regulated imports.",
  },
  {
    year: "2027+",
    label: "Full Enforcement",
    status: "future",
    desc: "Certificate surrender by 30 Sep 2027. Expanded sectors. Full EU ETS integration and installation-level verification required.",
  },
]

export { CheckCircle2 }
