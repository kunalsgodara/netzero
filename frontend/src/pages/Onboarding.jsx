import React, { useState } from "react";

import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils/routes";
import { Leaf, ArrowRight, ArrowLeft, Building2, Target, CheckCircle2 } from "lucide-react";
import Select from "@/components/ui/Select";

const db = globalThis.__B44_DB__

const steps = [
  { title: "Your Organization", icon: Building2 },
  { title: "Reduction Targets", icon: Target },
  { title: "All Set!", icon: CheckCircle2 },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", industry: "", country: "", reporting_year: new Date().getFullYear(), reduction_target_pct: 5, base_year: new Date().getFullYear() - 1 });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleFinish = async () => {
    setSaving(true);
    await db.entities.Organization.create({ ...form, onboarding_complete: true });
    setSaving(false);
    navigate(createPageUrl("Dashboard"));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 justify-center mb-10">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center"><Leaf className="w-6 h-6 text-primary-foreground" /></div>
          <div><h1 className="text-xl font-bold text-foreground">NetZeroWorks</h1><p className="text-[10px] text-muted-foreground uppercase tracking-widest">Setup Guide</p></div>
        </div>
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-12 h-0.5 rounded ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-xl p-8">
          {step === 0 && (
            <div className="space-y-5">
              <div className="text-center mb-6"><h2 className="text-lg font-bold">Tell us about your organization</h2><p className="text-xs text-muted-foreground mt-1">We'll configure your carbon accounting settings</p></div>
              <div><label className="text-xs font-medium">Organization Name *</label><input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm" placeholder="e.g. Acme Corp" /></div>
              <div><label className="text-xs font-medium">Industry *</label>
                <Select value={form.industry} onChange={(e) => setForm({...form, industry: e.target.value})} className="mt-1">
                  <option value="">Select...</option><option value="manufacturing">Manufacturing</option><option value="construction">Construction</option><option value="energy">Energy</option><option value="chemicals">Chemicals</option><option value="metals">Metals & Mining</option><option value="logistics">Logistics</option><option value="other">Other</option>
                </Select></div>
              <div><label className="text-xs font-medium">Country</label><input value={form.country} onChange={(e) => setForm({...form, country: e.target.value})} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm" placeholder="e.g. United Kingdom" /></div>
              <div><label className="text-xs font-medium">Reporting Year</label><input type="number" value={form.reporting_year} onChange={(e) => setForm({...form, reporting_year: parseInt(e.target.value)})} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm" /></div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center mb-6"><h2 className="text-lg font-bold">Set your reduction targets</h2><p className="text-xs text-muted-foreground mt-1">Define your baseline and goals</p></div>
              <div><label className="text-xs font-medium">Base Year</label><input type="number" value={form.base_year} onChange={(e) => setForm({...form, base_year: parseInt(e.target.value)})} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm" /></div>
              <div><label className="text-xs font-medium">Annual Reduction Target (%)</label><input type="number" step="0.1" value={form.reduction_target_pct} onChange={(e) => setForm({...form, reduction_target_pct: parseFloat(e.target.value)})} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm" /><p className="text-[10px] text-muted-foreground mt-1">Science-based targets recommend 4.2% per year for 1.5°C alignment</p></div>
            </div>
          )}
          {step === 2 && (
            <div className="text-center space-y-4 py-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto"><CheckCircle2 className="w-8 h-8 text-primary" /></div>
              <h2 className="text-lg font-bold">You're all set!</h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">Your organization is configured. Start tracking emissions from the dashboard.</p>
            </div>
          )}
          <div className="flex justify-between mt-8 pt-4 border-t border-border">
            {step > 0 ? <button onClick={() => setStep(step - 1)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted"><ArrowLeft className="w-4 h-4 inline mr-1.5" />Back</button> : <div />}
            {step < 2 ? (
              <button onClick={() => setStep(step + 1)} disabled={step === 0 && !form.name} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">Next <ArrowRight className="w-4 h-4 inline ml-1.5" /></button>
            ) : (
              <button onClick={handleFinish} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saving ? "Saving..." : "Go to Dashboard"} <ArrowRight className="w-4 h-4 inline ml-1.5" /></button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
