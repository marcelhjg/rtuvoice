"use client";

import { useMemo, useState } from "react";
import { BarList, ChartCard, GroupedColumns, SERIES } from "@/components/admin/charts";
import { BackToDashboard, adminStyles as s } from "@/components/admin/bits";
import { useDemoStore } from "@/lib/demo-store";
import { daysBetween, slaInfo } from "@/lib/sla";
import { CATEGORIES, PRIORITIES, type Complaint } from "@/lib/types";
import styles from "./statistics.module.css";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const approved = (c: Complaint) => c.status === "Assigned" || c.status === "In Progress" || c.status === "Resolved";

export default function StatisticsPage() {
  const { complaints, departments } = useDemoStore();
  const departmentNames = useMemo(() => departments.map((d) => d.name), [departments]);
  const [dept, setDept] = useState("");

  const stats = useMemo(() => {
    // With a department selected, only complaints routed to that department count.
    const scope = dept ? complaints.filter((c) => c.department === dept) : complaints;
    const routed = scope.filter(approved);
    const resolved = scope.filter((c) => c.status === "Resolved");
    const overdue = routed.filter((c) => slaInfo(c).overdueDays > 0);
    const avgDays = resolved.length ? resolved.reduce((sum, c) => sum + daysBetween(c.assignedAt!, c.resolvedAt!), 0) / resolved.length : 0;

    const byCategory = CATEGORIES.map((cat) => ({ label: cat, value: scope.filter((c) => c.category === cat).length })).sort((a, b) => b.value - a.value);
    const byDepartment = departmentNames.map((d) => ({ label: d, value: complaints.filter((c) => c.department === d).length })).sort((a, b) => b.value - a.value);
    const byPriority = PRIORITIES.map((p) => ({ label: p, value: routed.filter((c) => c.priority === p).length }));

    // Last 6 calendar months (Philippine time), submitted vs resolved.
    const now = new Date(Date.now() + 8 * 3600 * 1000);
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1));
      return { key: `${d.getUTCFullYear()}-${d.getUTCMonth()}`, label: MONTHS[d.getUTCMonth()] };
    });
    const monthKey = (iso: string) => {
      const d = new Date(new Date(iso).getTime() + 8 * 3600 * 1000);
      return `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    };
    const monthly = months.map((m) => ({
      label: m.label,
      values: [scope.filter((c) => monthKey(c.submittedAt) === m.key).length, resolved.filter((c) => monthKey(c.resolvedAt!) === m.key).length],
    }));

    return {
      total: scope.length,
      resolveRate: routed.length ? Math.round((resolved.length / routed.length) * 100) : 0,
      resolvedCount: resolved.length,
      routedCount: routed.length,
      overdue: overdue.length,
      avgDays,
      byCategory,
      byDepartment,
      byPriority,
      monthly,
      topCategory: byCategory[0],
      topDepartment: byDepartment[0],
    };
  }, [complaints, dept, departmentNames]);

  return (
    <div className="container">
      <div className={s.head}>
        <BackToDashboard />
        <h1 className={s.listTitle}>Statistics</h1>
        <p className={s.subtitle}>
          {dept ? `Department-level statistics for ${dept}.` : "Campus-wide complaint statistics. Choose a department to narrow them down."}
        </p>
      </div>

      <div className={styles.filterRow}>
        <label htmlFor="stats-dept" className={styles.filterLabel}>
          Department
        </label>
        <select id="stats-dept" className={`select ${s.filter}`} value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="">All departments</option>
          {departmentNames.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <ul className={styles.tiles}>
        <li className={styles.tile}>
          <span className={styles.tileLabel}>{dept ? "Complaints routed" : "Total complaints"}</span>
          <span className={styles.tileValue}>{stats.total}</span>
          <span className={styles.tileNote}>{dept ? "assigned to this department" : "including pending and rejected"}</span>
        </li>
        <li className={styles.tile}>
          <span className={styles.tileLabel}>Resolve rate</span>
          <span className={styles.tileValue}>{stats.resolveRate}%</span>
          <span className={styles.tileNote}>
            {stats.resolvedCount} of {stats.routedCount} approved complaints
          </span>
        </li>
        <li className={styles.tile}>
          <span className={styles.tileLabel}>Overdue now</span>
          <span className={styles.tileValue}>{stats.overdue}</span>
          <span className={styles.tileNote}>past the resolve-within target</span>
        </li>
        <li className={styles.tile}>
          <span className={styles.tileLabel}>Average time to resolve</span>
          <span className={styles.tileValue}>{stats.avgDays ? `${stats.avgDays.toFixed(1)}d` : "—"}</span>
          <span className={styles.tileNote}>from assignment to resolution</span>
        </li>
      </ul>

      <div className={styles.charts}>
        <ChartCard
          title="Complaints by category"
          subtitle={stats.topCategory?.value ? `Top category: ${stats.topCategory.label}` : undefined}
          table={{ headers: ["Category", "Complaints"], rows: stats.byCategory.map((d) => [d.label, d.value]) }}
        >
          <BarList data={stats.byCategory} />
        </ChartCard>

        {dept ? (
          <ChartCard
            title="Priority levels"
            subtitle="Set by AI when a complaint is assigned"
            table={{ headers: ["Priority", "Complaints"], rows: stats.byPriority.map((d) => [d.label, d.value]) }}
          >
            <BarList data={stats.byPriority} />
          </ChartCard>
        ) : (
          <ChartCard
            title="Complaints by department"
            subtitle={stats.topDepartment?.value ? `Top department: ${stats.topDepartment.label}` : undefined}
            table={{ headers: ["Department", "Complaints"], rows: stats.byDepartment.map((d) => [d.label, d.value]) }}
          >
            <BarList data={stats.byDepartment} />
          </ChartCard>
        )}

        <ChartCard
          title="Monthly trend"
          subtitle="Complaints submitted and resolved per month, last 6 months"
          legend={[
            { label: "Submitted", color: SERIES[0] },
            { label: "Resolved", color: SERIES[1] },
          ]}
          table={{ headers: ["Month", "Submitted", "Resolved"], rows: stats.monthly.map((m) => [m.label, ...m.values]) }}
        >
          <GroupedColumns data={stats.monthly} series={["Submitted", "Resolved"]} />
        </ChartCard>

        {dept ? null : (
          <ChartCard
            title="Priority levels"
            subtitle="Set by AI when a complaint is assigned"
            table={{ headers: ["Priority", "Complaints"], rows: stats.byPriority.map((d) => [d.label, d.value]) }}
          >
            <BarList data={stats.byPriority} />
          </ChartCard>
        )}
      </div>
      <p className={styles.note}>Demo data: figures are calculated live from the sample complaints in this browser.</p>
    </div>
  );
}
