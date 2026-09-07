import { heatLevel } from "../../lib/streak.js";

const LEVEL_CLASS = [
  "bg-slate-100",
  "bg-emerald-200",
  "bg-emerald-400",
  "bg-emerald-600",
  "bg-emerald-800",
];

const WEEKDAY_LABELS = { 1: "Mon", 3: "Wed", 5: "Fri" };

export default function ActivityHeatmap({ weeks, monthLabels, title = "Activity" }) {
  return (
    <div>
      {title ? <p className="text-sm font-bold text-slate-500">{title}</p> : null}
      <div className="mt-3 overflow-x-auto pb-2">
        <div className="inline-flex gap-2">
          <div className="flex flex-col justify-between gap-[3px] pt-[18px] text-[11px] font-semibold text-slate-400">
            {[0, 1, 2, 3, 4, 5, 6].map((row) => (
              <span key={row} className="h-[11px] leading-[11px]">{WEEKDAY_LABELS[row] || ""}</span>
            ))}
          </div>
          <div>
            <div className="relative h-[14px] text-[11px] font-semibold text-slate-400">
              {monthLabels.map(({ weekIndex, label }) => (
                <span key={`${label}-${weekIndex}`} className="absolute top-0" style={{ left: weekIndex * 14 }}>
                  {label}
                </span>
              ))}
            </div>
            <div className="flex gap-[3px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.map((cell) => (
                    <div
                      key={cell.date}
                      title={cell.future ? undefined : `${cell.date}: ${Math.round((cell.minutes / 60) * 10) / 10}h`}
                      className={`h-[11px] w-[11px] rounded-[2px] ${cell.future ? "bg-transparent" : LEVEL_CLASS[heatLevel(cell.minutes)]}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[11px] font-semibold text-slate-400">
        <span>Less</span>
        {LEVEL_CLASS.map((cls) => (
          <span key={cls} className={`h-[11px] w-[11px] rounded-[2px] ${cls}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
