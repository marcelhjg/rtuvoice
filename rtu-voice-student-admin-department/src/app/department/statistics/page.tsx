"use client";

import { useMemo } from "react";
import { BarList, ChartCard, GroupedColumns, SERIES } from "@/components/admin/charts";
import { BackToDashboard, adminStyles as s } from "@/components/admin/bits";
import { useDemoStore } from "@/lib/demo-store";
import { attentionInfo, daysBetween, slaInfo } from "@/lib/sla";
import { PRIORITIES } from "@/lib/types";
import styles from "./statistics.module.css";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Department statistics (roadmap Sprint 5): priority-level counts, monthly trend and resolved rate for this department only. */
export default function DepartmentStatisticsPage() {
  const { departmentComplaints: all, session } = useDemoStore();

  const stats = useMemo(() => {
    const resolved = all.filter((c) => c.status === "Resolved");
    const overdue = all.filter((c) => slaInfo(c).overdueDays > 0);
    const needs = all.filter((c) => attentionInfo(c));
    const avgDays = resolved.length ? resolved.reduce((sum, c) => sum + daysBetween(c.assignedAt!, c.resolvedAt!), 0) / resolved.length : 0;
    const byPriority = PRIORITIES.map((p) => ({ label: p, value: all.filter((c) => c.priority === p).length }));

    // Last 6 calendar months (Philippine time): complaints received (assigned) vs resolved.
    const now = new Date(Date.now() + 8 * 3600 * 1000);
    const months = Array.from({ length: 6 }, (_, i) => {
      const dt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1));
      return { key: `${dt.getUTCFullYear()}-${dt.getUTCMonth()}`, label: MONTHS[dt.getUTCMonth()] };
    });
    const monthKey = (iso: string) => {
      const dt = new Date(new Date(iso).getTime() + 8 * 3600 * 1000);
      return `${dt.getUTCFullYear()}-${dt.getUTCMonth()}`;
    };
    const monthly = months.map((m) => ({
      label: m.label,
      values: [all.filter((c) => monthKey(c.assignedAt ?? c.submittedAt) === m.key).length, resolved.filter((c) => monthKey(c.resolvedAt!) === m.key).length],
    }));

    return {
      total: all.length,
      resolvedCount: resolved.length,
      resolveRate: all.length ? Math.round((resolved.length / all.length) * 100) : 0,
      overdue: overdue.length,
      needs: needs.length,
      avgDays,
      byPriority,
      monthly,
    };
  }, [all]);

  return (
    <div className="container">
      <div className={s.head}>
        <BackToDashboard href="/department" />
        <h1 className={s.listTitle}>Statistics</h1>
        <p className={s.subtitle}>Statistics for {session?.department ?? "your department"} only.</p>
      </div>

      <ul className={styles.tiles}>
        <li className={styles.tile}>
          <span className={styles.tileLabel}>Total complaints</span>
          <span className={styles.tileValue}>{stats.total}</span>
          <span className={styles.tileNote}>assigned to your department</span>
        </li>
        <li className={styles.tile}>
          <span className={styles.tileLabel}>Resolved rate</span>
          <span className={styles.tileValue}>{stats.resolveRate}%</span>
          <span className={styles.tileNote}>
            {stats.resolvedCount} of {stats.total} complaints
          </span>
        </li>
        <li className={styles.tile}>
          <span className={styles.tileLabel}>Overdue now</span>
          <span className={styles.tileValue}>{stats.overdue}</span>
          <span className={styles.tileNote}>{stats.needs} need attention in total</span>
        </li>
        <li className={styles.tile}>
          <span className={styles.tileLabel}>Average time to resolve</span>
          <span className={styles.tileValue}>{stats.avgDays ? `${stats.avgDays.toFixed(1)}d` : "—"}</span>
          <span className={styles.tileNote}>from assignment to resolution</span>
        </li>
      </ul>

      <div className={styles.charts}>
        <ChartCard
          title="Priority levels"
          subtitle="Set by AI when a complaint is assigned"
          table={{ headers: ["Priority", "Complaints"], rows: stats.byPriority.map((r) => [r.label, r.value]) }}
        >
          <BarList data={stats.byPriority} />
        </ChartCard>

        <ChartCard
          title="Monthly trend"
          subtitle="Complaints received and resolved per month, last 6 months"
          legend={[
            { label: "Received", color: SERIES[0] },
            { label: "Resolved", color: SERIES[1] },
          ]}
          table={{ headers: ["Month", "Received", "Resolved"], rows: stats.monthly.map((r) => [r.label, ...r.values]) }}
        >
          <GroupedColumns data={stats.monthly} series={["Received", "Resolved"]} />
        </ChartCard>
      </div>
      <p className={styles.note}>Demo data: figures are calculated live from the sample complaints in this browser.</p>
    </div>
  );
}
