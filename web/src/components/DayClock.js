"use client";

import { useEffect, useState } from "react";
import { getTaskSlotBounds, parseTimeToMinutes, dateKey, formatClock } from "../../lib/taskSchedule.js";

const SIZE = 260;
const CENTER = SIZE / 2;
const RING_OUTER = 112;
const RING_INNER = 84;
const TICK_RADIUS = 122;
const HAND_RADIUS = 78;

function angleForMinutes(minutes) {
  return (minutes / 1440) * 360 - 90;
}

function polarToCartesian(radius, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) };
}

function ringArcPath(startMinutes, endMinutes, rOuter = RING_OUTER, rInner = RING_INNER) {
  const startAngle = angleForMinutes(startMinutes);
  const endAngle = angleForMinutes(Math.max(endMinutes, startMinutes + 4));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const outerStart = polarToCartesian(rOuter, startAngle);
  const outerEnd = polarToCartesian(rOuter, endAngle);
  const innerEnd = polarToCartesian(rInner, endAngle);
  const innerStart = polarToCartesian(rInner, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

export default function DayClock({ tasks, date }) {
  const [now, setNow] = useState(() => new Date());
  const isToday = date === dateKey(new Date());

  useEffect(() => {
    if (!isToday) return undefined;
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, [isToday]);

  const segments = tasks
    .map((task) => {
      const bounds = getTaskSlotBounds(task, date);
      if (!bounds) return null;
      return {
        id: task._id,
        title: task.title,
        color: task.category?.color || "#6B7280",
        startMinutes: parseTimeToMinutes(bounds.slotStart),
        endMinutes: parseTimeToMinutes(bounds.slotEnd),
        slotStart: bounds.slotStart,
        slotEnd: bounds.slotEnd,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.endMinutes - b.startMinutes) - (a.endMinutes - a.startMinutes));

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowAngle = angleForMinutes(nowMinutes);
  const handTip = polarToCartesian(HAND_RADIUS, nowAngle);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
        <circle cx={CENTER} cy={CENTER} r={RING_OUTER} fill="none" stroke="#F1F5F9" strokeWidth={RING_OUTER - RING_INNER} />

        {Array.from({ length: 24 }, (_, hour) => {
          const angle = angleForMinutes(hour * 60);
          const outer = polarToCartesian(TICK_RADIUS, angle);
          const inner = polarToCartesian(TICK_RADIUS - (hour % 3 === 0 ? 8 : 4), angle);
          return (
            <line
              key={hour}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="#CBD5E1"
              strokeWidth={hour % 3 === 0 ? 1.5 : 1}
            />
          );
        })}

        {[0, 6, 12, 18].map((hour) => {
          const pos = polarToCartesian(TICK_RADIUS + 14, angleForMinutes(hour * 60));
          return (
            <text key={hour} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill="#94A3B8">
              {String(hour).padStart(2, "0")}
            </text>
          );
        })}

        {segments.map((segment) => (
          <path key={segment.id} d={ringArcPath(segment.startMinutes, segment.endMinutes)} fill={segment.color}>
            <title>{`${segment.title} · ${formatClock(`${date}T${segment.slotStart}:00`)} - ${formatClock(`${date}T${segment.slotEnd}:00`)}`}</title>
          </path>
        ))}

        <circle cx={CENTER} cy={CENTER} r={RING_INNER - 4} fill="white" />

        {isToday ? (
          <>
            <line x1={CENTER} y1={CENTER} x2={handTip.x} y2={handTip.y} stroke="#DC2626" strokeWidth={2.5} strokeLinecap="round" />
            <circle cx={CENTER} cy={CENTER} r={4} fill="#DC2626" />
          </>
        ) : null}

        <text x={CENTER} y={CENTER - 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#0F172A">
          {isToday ? now.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) : "—"}
        </text>
        <text x={CENTER} y={CENTER + 14} textAnchor="middle" fontSize="10" fontWeight="600" fill="#94A3B8">
          {isToday ? "Now" : "Selected day"}
        </text>
      </svg>

      <div className="flex-1 space-y-2">
        {segments.length === 0 ? (
          <p className="text-sm text-slate-500">No scheduled time slots for this date.</p>
        ) : (
          segments.map((segment) => (
            <div key={segment.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="flex-1 truncate text-sm font-bold text-slate-950">{segment.title}</span>
              <span className="shrink-0 text-xs font-semibold text-slate-500">
                {formatClock(`${date}T${segment.slotStart}:00`)} - {formatClock(`${date}T${segment.slotEnd}:00`)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
