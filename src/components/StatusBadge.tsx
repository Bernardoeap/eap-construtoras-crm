import { STATUS_COLOR, STATUS_LABEL } from "@/lib/classify";

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLOR[status] ?? "bg-slate-200 text-slate-800";
  const label = STATUS_LABEL[status] ?? status;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}
