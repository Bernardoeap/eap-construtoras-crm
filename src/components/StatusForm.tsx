"use client";

import { updateStatus } from "@/server-actions/construtoras";
import { STATUS_LABEL, STATUS_ORDEM } from "@/lib/classify";
import { useTransition } from "react";

export function StatusForm({ construtoraId, current }: { construtoraId: string; current: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={current}
      disabled={pending}
      onChange={(e) => start(() => updateStatus(construtoraId, e.target.value))}
      className="px-3 py-2 border rounded-md text-sm bg-white"
    >
      {STATUS_ORDEM.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
