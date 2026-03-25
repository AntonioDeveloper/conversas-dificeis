import * as React from "react";

type Props = {
  title?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

export function Card({ title, icon, right, className, children }: Props) {
  return (
    <div className={"rounded-2xl border border-white/10 bg-black/40 dark:bg-black/60 p-4 text-zinc-200 " + (className ?? "")}>
      {title ? (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-400">
            {icon ? <span className="inline-flex items-center justify-center size-2.5 rounded-full bg-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.6)]" /> : null}
            <span>{title}</span>
          </div>
          {right ? <div className="flex items-center gap-2">{right}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
