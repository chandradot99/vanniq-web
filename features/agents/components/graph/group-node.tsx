"use client";

import { memo } from "react";
import { NodeResizer } from "@xyflow/react";
import { Layers } from "lucide-react";

export const GROUP_COLORS = [
  { bg: "bg-slate-500/5",  border: "border-slate-400/40",  text: "text-slate-500",  label: "Default" },
  { bg: "bg-blue-500/5",   border: "border-blue-400/40",   text: "text-blue-500",   label: "Blue"    },
  { bg: "bg-violet-500/5", border: "border-violet-400/40", text: "text-violet-500", label: "Violet"  },
  { bg: "bg-green-500/5",  border: "border-green-400/40",  text: "text-green-500",  label: "Green"   },
  { bg: "bg-amber-500/5",  border: "border-amber-400/40",  text: "text-amber-500",  label: "Amber"   },
  { bg: "bg-rose-500/5",   border: "border-rose-400/40",   text: "text-rose-500",   label: "Rose"    },
];

export interface GroupNodeData {
  label: string;
  colorIndex: number;
  [key: string]: unknown;
}

interface Props {
  data: GroupNodeData;
  selected?: boolean;
}

export const GroupNode = memo(function GroupNode({ data, selected }: Props) {
  const color = GROUP_COLORS[data.colorIndex ?? 0];

  return (
    <>
      <NodeResizer
        minWidth={240}
        minHeight={160}
        isVisible={selected}
        lineClassName="!border-primary/50"
        handleClassName="!w-2.5 !h-2.5 !rounded-sm !border-primary/50 !bg-background"
      />
      <div className={`w-full h-full rounded-xl border-2 border-dashed ${color.border} ${color.bg}`}>
        <div className="flex items-center gap-1.5 px-3 py-2 select-none">
          <Layers className={`h-3 w-3 ${color.text} shrink-0`} />
          <span className={`text-[11px] font-semibold ${color.text} tracking-wide`}>
            {data.label || "Group"}
          </span>
        </div>
      </div>
    </>
  );
});
