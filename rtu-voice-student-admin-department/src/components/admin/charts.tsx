"use client";

import { useState, type ReactNode } from "react";
import styles from "./charts.module.css";

/**
 * Small, dependency-free charts for the Statistics page.
 * Palette validated with the dataviz checker (light surface #ffffff):
 *   series 1 #2f6bd3, series 2 #c7870f — all six checks pass.
 * Text never uses the series colour; identity comes from swatches beside labels.
 */
export const SERIES = ["#2f6bd3", "#c7870f"] as const;

interface ChartCardProps {
  title: string;
  subtitle?: string;
  table: { headers: string[]; rows: (string | number)[][] };
  legend?: { label: string; color: string }[];
  children: ReactNode;
}

/** Card with a chart / table toggle so values never depend on colour or hover alone. */
export function ChartCard({ title, subtitle, table, legend, children }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);
  return (
    <section className={styles.card} aria-label={title}>
      <div className={styles.cardHead}>
        <div>
          <h2 className={styles.cardTitle}>{title}</h2>
          {subtitle ? <p className={styles.cardSub}>{subtitle}</p> : null}
        </div>
        <button type="button" className={styles.toggle} aria-pressed={showTable} onClick={() => setShowTable((v) => !v)}>
          {showTable ? "Show chart" : "Show table"}
        </button>
      </div>
      {legend && !showTable ? (
        <ul className={styles.legend}>
          {legend.map((l) => (
            <li key={l.label}>
              <span className={styles.swatch} style={{ background: l.color }} aria-hidden="true" />
              {l.label}
            </li>
          ))}
        </ul>
      ) : null}
      {showTable ? (
        <table className={styles.dataTable}>
          <thead>
            <tr>
              {table.headers.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r) => (
              <tr key={String(r[0])}>
                {r.map((v, i) => (i === 0 ? <th key={i} scope="row">{v}</th> : <td key={i}>{v}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        children
      )}
    </section>
  );
}

/** Horizontal bars: one series, value at the tip, hover/focus tooltip. */
export function BarList({ data, unit = "complaints" }: { data: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.every((d) => d.value === 0)) return <p className={styles.empty}>No data for this selection.</p>;
  return (
    <ul className={styles.bars}>
      {data.map((d) => (
        <li key={d.label} className={styles.barRow} tabIndex={0} aria-label={`${d.label}: ${d.value} ${unit}`}>
          <span className={styles.barLabel}>{d.label}</span>
          <span className={styles.barTrack}>
            <span className={styles.bar} style={{ width: `${(d.value / max) * 100}%`, background: SERIES[0] }} />
            <span className={styles.barValue}>{d.value}</span>
            <span className={styles.tip} role="tooltip">
              <strong>{d.value}</strong> {unit}
              <br />
              {d.label}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Grouped columns for a short time series with up to two measures on one axis. */
export function GroupedColumns({ data, series }: { data: { label: string; values: number[] }[]; series: string[] }) {
  const max = Math.max(1, ...data.flatMap((d) => d.values));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step).reverse();
  return (
    <div className={styles.cols}>
      <div className={styles.yAxis} aria-hidden="true">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <div className={styles.plot}>
        <div className={styles.grid} aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} />
          ))}
        </div>
        {data.map((d) => (
          <div
            key={d.label}
            className={styles.group}
            tabIndex={0}
            aria-label={`${d.label}: ${series.map((s, i) => `${s} ${d.values[i]}`).join(", ")}`}
          >
            <div className={styles.groupBars}>
              {d.values.map((v, i) => (
                <span key={i} className={styles.col} style={{ height: `${(v / top) * 100}%`, background: SERIES[i] }} />
              ))}
            </div>
            <span className={styles.colLabel}>{d.label}</span>
            <span className={`${styles.tip} ${styles.tipCol}`} role="tooltip">
              <strong>{d.label}</strong>
              {series.map((s, i) => (
                <span key={s} className={styles.tipLine}>
                  <span className={styles.swatch} style={{ background: SERIES[i] }} aria-hidden="true" />
                  {s}: {d.values[i]}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function niceStep(max: number) {
  if (max <= 5) return 1;
  if (max <= 10) return 2;
  if (max <= 25) return 5;
  return Math.ceil(max / 5 / 5) * 5;
}
