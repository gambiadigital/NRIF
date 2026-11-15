"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle, LinkSimple, Image as ImageIcon } from "@phosphor-icons/react";
import { AdminTitle, Panel, Empty } from "@/components/admin/Shell";
import { Badge, TextInput } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { api } from "@/lib/client";
import { useAdmin, when } from "@/lib/admin-client";
import { cn } from "@/lib/cn";

type Row = {
  id: string;
  status: string;
  run_date: string;
  distance_km: number;
  duration_seconds: number;
  link: string | null;
  has_image: boolean;
  review_note: string | null;
  reviewed_by: string | null;
  created_at: string;
  full_name: string;
  bib: string | null;
  event: string;
  event_km: number;
  reference: string;
  lives_in: string | null;
};

const hms = (s: number) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const pace = (s: number, km: number) => {
  const p = s / km;
  return `${Math.floor(p / 60)}:${String(Math.round(p % 60)).padStart(2, "0")} /km`;
};

/** Virtual runners' proof, waiting for a person to check it. Approving unlocks their e-certificate. */
export default function VirtualRuns() {
  const { data, reload } = useAdmin<{ rows: Row[] }>("/api/admin/virtual");
  const [open, setOpen] = useState<Row | null>(null);
  const waiting = data?.rows.filter((r) => r.status === "submitted") ?? [];
  const done = data?.rows.filter((r) => r.status !== "submitted") ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <AdminTitle title="Virtual runs" sub="Check the date, distance and time on each screenshot or link. Approving unlocks the runner's e-certificate." />
      <Panel title={`Waiting (${waiting.length})`}>
        {waiting.length ? <Rows rows={waiting} onOpen={setOpen} /> : <Empty>Nothing to check. Uploads open on 23 January.</Empty>}
      </Panel>
      {done.length > 0 && (
        <Panel title="Checked" className="mt-4">
          <Rows rows={done} onOpen={setOpen} />
        </Panel>
      )}
      <Review row={open} onClose={() => setOpen(null)} onDone={reload} />
    </div>
  );
}

function Rows({ rows, onOpen }: { rows: Row[]; onOpen: (r: Row) => void }) {
  return (
    <ul className="divide-y divide-line">
      {rows.map((r) => (
        <li key={r.id}>
          <button onClick={() => onOpen(r)} className="flex w-full flex-wrap items-center gap-3 py-3 text-left hover:bg-paper sm:flex-nowrap">
            <span className="w-16 font-mono text-sm font-semibold text-cobalt">{r.bib}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-navy">{r.full_name}</span>
              <span className="block text-xs text-muted">
                {r.event} · {r.lives_in} · sent {when(r.created_at)}
              </span>
            </span>
            <span className="text-sm text-navy tabular">
              {r.distance_km} km · {hms(r.duration_seconds)}
            </span>
            {r.has_image ? <ImageIcon className="size-4 text-muted" /> : <LinkSimple className="size-4 text-muted" />}
            <Badge tone={r.status === "approved" ? "forest" : r.status === "rejected" ? "ember" : "sun"}>{r.status === "submitted" ? "To check" : r.status}</Badge>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Review({ row, onClose, onDone }: { row: Row | null; onClose: () => void; onDone: () => Promise<void> }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  async function decide(status: "approved" | "rejected") {
    if (!row) return;
    setBusy(true);
    try {
      await api(`/api/admin/virtual/${row.id}`, { method: "PATCH", json: { status, note: note || undefined } });
      toast.success(status === "approved" ? `${row.full_name}'s run approved` : "Sent back with your note");
      setNote("");
      onClose();
      await onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const short = row && row.distance_km < row.event_km * 0.98;
  return (
    <Sheet
      open={!!row}
      onOpenChange={(o) => !o && onClose()}
      title={row ? `${row.full_name} · ${row.event}` : ""}
      description={row ? `${row.reference} · ran ${new Date(row.run_date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}` : undefined}
      wide
      footer={
        <div className="flex flex-wrap items-center gap-3">
          <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the runner (needed to send back)" className="h-11 min-w-0 flex-1" />
          <Button variant="line" className="text-ember" icon={<XCircle weight="bold" className="size-4" />} disabled={busy || note.trim().length < 3} onClick={() => decide("rejected")}>
            Send back
          </Button>
          <Button icon={<CheckCircle weight="bold" className="size-4" />} disabled={busy} onClick={() => decide("approved")}>
            Approve
          </Button>
        </div>
      }
    >
      {row && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_14rem]">
          <div className="overflow-hidden rounded-2xl bg-paper">
            {row.has_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/admin/virtual/${row.id}/image`} alt="Run screenshot" className="max-h-[60vh] w-full object-contain" />
            ) : (
              <a href={row.link ?? "#"} target="_blank" rel="noreferrer" className="flex h-40 items-center justify-center gap-2 font-semibold text-cobalt hover:underline">
                <LinkSimple weight="bold" className="size-5" /> Open the activity link
              </a>
            )}
          </div>
          <dl className="space-y-3 text-sm">
            {[
              ["Distance", `${row.distance_km} km`, short],
              ["Time", hms(row.duration_seconds), false],
              ["Pace", pace(row.duration_seconds, row.distance_km), false],
              ["Event distance", `${row.event_km} km`, false],
              ["Status", row.status + (row.reviewed_by ? ` by ${row.reviewed_by}` : ""), false],
            ].map(([k, v, warn]) => (
              <div key={String(k)}>
                <dt className="text-muted">{k}</dt>
                <dd className={cn("font-semibold", warn ? "text-ember" : "text-navy")}>{v}</dd>
              </div>
            ))}
            {row.review_note && <p className="rounded-xl bg-paper p-3 text-muted">{row.review_note}</p>}
          </dl>
        </div>
      )}
    </Sheet>
  );
}
