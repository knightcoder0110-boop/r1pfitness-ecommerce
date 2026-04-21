"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Size data ──────────────────────────────────────────────────────────── */

type Measurement = {
  size: string;
  chest: string;
  length: string;
  shoulder?: string;
  sleeve?: string;
};

const TEES: Measurement[] = [
  { size: "XS", chest: '34–36"', length: '27"', shoulder: '16.5"' },
  { size: "S",  chest: '36–38"', length: '28"', shoulder: '17.5"' },
  { size: "M",  chest: '38–40"', length: '29"', shoulder: '18.5"' },
  { size: "L",  chest: '41–43"', length: '30"', shoulder: '19.5"' },
  { size: "XL", chest: '44–46"', length: '31"', shoulder: '20.5"' },
  { size: "2XL", chest: '47–49"', length: '32"', shoulder: '21.5"' },
];

const HOODIES: Measurement[] = [
  { size: "XS", chest: '36–38"', length: '26"', sleeve: '33"' },
  { size: "S",  chest: '38–40"', length: '27"', sleeve: '34"' },
  { size: "M",  chest: '40–42"', length: '28"', sleeve: '35"' },
  { size: "L",  chest: '43–45"', length: '29"', sleeve: '36"' },
  { size: "XL", chest: '46–48"', length: '30"', sleeve: '37"' },
  { size: "2XL", chest: '49–51"', length: '31"', sleeve: '38"' },
];

type BottomMeasurement = {
  size: string;
  waist: string;
  hip: string;
  inseam: string;
};

const BOTTOMS: BottomMeasurement[] = [
  { size: "XS", waist: '26–28"', hip: '34–36"', inseam: '29"' },
  { size: "S",  waist: '28–30"', hip: '36–38"', inseam: '30"' },
  { size: "M",  waist: '30–32"', hip: '38–40"', inseam: '30"' },
  { size: "L",  waist: '32–34"', hip: '40–42"', inseam: '31"' },
  { size: "XL", waist: '34–36"', hip: '42–44"', inseam: '31"' },
  { size: "2XL", waist: '36–38"', hip: '44–46"', inseam: '32"' },
];

const TABS = ["Tees", "Hoodies", "Bottoms"] as const;
type Tab = (typeof TABS)[number];

/* ── Sub-components ─────────────────────────────────────────────────────── */

function TableHead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr>
        {cols.map((col) => (
          <th
            key={col}
            className="py-2 px-3 text-left font-mono text-[9px] uppercase tracking-[0.3em] text-muted border-b border-border"
          >
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function SizeTable({ tab }: { tab: Tab }) {
  if (tab === "Tees") {
    return (
      <table className="w-full text-sm">
        <TableHead cols={["Size", "Chest", "Length", "Shoulder"]} />
        <tbody>
          {TEES.map((r, i) => (
            <tr key={r.size} className={i % 2 === 0 ? "bg-surface/30" : ""}>
              <td className="py-2 px-3 font-mono text-xs font-bold text-text">{r.size}</td>
              <td className="py-2 px-3 font-mono text-xs text-subtle">{r.chest}</td>
              <td className="py-2 px-3 font-mono text-xs text-subtle">{r.length}</td>
              <td className="py-2 px-3 font-mono text-xs text-subtle">{r.shoulder}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (tab === "Hoodies") {
    return (
      <table className="w-full text-sm">
        <TableHead cols={["Size", "Chest", "Length", "Sleeve"]} />
        <tbody>
          {HOODIES.map((r, i) => (
            <tr key={r.size} className={i % 2 === 0 ? "bg-surface/30" : ""}>
              <td className="py-2 px-3 font-mono text-xs font-bold text-text">{r.size}</td>
              <td className="py-2 px-3 font-mono text-xs text-subtle">{r.chest}</td>
              <td className="py-2 px-3 font-mono text-xs text-subtle">{r.length}</td>
              <td className="py-2 px-3 font-mono text-xs text-subtle">{r.sleeve}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <table className="w-full text-sm">
      <TableHead cols={["Size", "Waist", "Hip", "Inseam"]} />
      <tbody>
        {BOTTOMS.map((r, i) => (
          <tr key={r.size} className={i % 2 === 0 ? "bg-surface/30" : ""}>
            <td className="py-2 px-3 font-mono text-xs font-bold text-text">{r.size}</td>
            <td className="py-2 px-3 font-mono text-xs text-subtle">{r.waist}</td>
            <td className="py-2 px-3 font-mono text-xs text-subtle">{r.hip}</td>
            <td className="py-2 px-3 font-mono text-xs text-subtle">{r.inseam}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */

interface SizeGuideModalProps {
  /** Initial tab to open. Pass "Hoodies" for hoodie PDPs, etc. */
  defaultTab?: Tab;
}

export function SizeGuideModal({ defaultTab = "Tees" }: SizeGuideModalProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  return (
    <>
      {/* Trigger link */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted underline underline-offset-2 hover:text-gold transition-colors cursor-pointer"
        aria-haspopup="dialog"
      >
        Size Guide
      </button>

      {/* Overlay + modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-[#0D0D0D]/80 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden
            />

            {/* Modal panel */}
            <motion.div
              key="panel"
              role="dialog"
              aria-modal="true"
              aria-label="Size Guide"
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="fixed inset-x-4 top-1/2 z-50 max-w-lg w-full mx-auto -translate-y-1/2 bg-[#141414] border border-[rgba(242,237,228,0.12)] shadow-[0_24px_48px_rgba(0,0,0,0.7)] overflow-hidden"
              style={{ left: "50%", transform: "translateX(-50%) translateY(-50%)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-muted">
                    R1P FITNESS
                  </p>
                  <h2 className="font-display text-xl tracking-wider text-text mt-0.5">
                    Size Guide
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-muted hover:text-text transition-colors text-2xl leading-none cursor-pointer"
                  aria-label="Close size guide"
                >
                  ×
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 font-mono text-[10px] uppercase tracking-[0.25em] transition-colors cursor-pointer ${
                      activeTab === tab
                        ? "text-gold border-b-2 border-gold"
                        : "text-muted hover:text-text"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="px-4 py-4 overflow-x-auto">
                <SizeTable tab={activeTab} />
              </div>

              {/* Footer note */}
              <p className="px-6 pb-5 font-serif italic text-xs text-muted/60">
                All measurements in inches. For best fit, measure your body and
                compare — not your garment. When between sizes, size up.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
