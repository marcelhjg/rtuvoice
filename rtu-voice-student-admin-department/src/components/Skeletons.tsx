"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./Skeletons.module.css";

export const DEMO_SKELETON_MINIMUM_DISPLAY_MS = 700;

export interface SkeletonColumn {
  label: string;
  width?: string;
  barWidth?: string;
}

export type SkeletonVariant = "student" | "console";

const STUDENT_COLUMNS: SkeletonColumn[] = [
  { label: "Date", width: "1fr", barWidth: "68px" },
  { label: "Tracking ID", width: "1.25fr", barWidth: "104px" },
  { label: "Title", width: "1.8fr", barWidth: "72%" },
  { label: "Category", width: "1.35fr", barWidth: "82px" },
  { label: "Status", width: "1fr", barWidth: "76px" },
];

const CONSOLE_COLUMNS: SkeletonColumn[] = [
  { label: "Date", width: "0.9fr", barWidth: "68px" },
  { label: "Tracking ID", width: "1.1fr", barWidth: "100px" },
  { label: "Title", width: "1.7fr", barWidth: "74%" },
  { label: "Category", width: "1.25fr", barWidth: "78px" },
  { label: "Department", width: "1.3fr", barWidth: "92px" },
  { label: "Status", width: "1fr", barWidth: "72px" },
];

const DETAIL_FIELDS = ["field-one", "field-two", "field-three", "field-four"];

export function useMinimumSkeletonDisplay() {
  const [minimumElapsed, setMinimumElapsed] = useState(false);

  useEffect(() => {
    // Demo-only: set to zero or remove this delay once a real backend is connected.
    const timer = window.setTimeout(() => setMinimumElapsed(true), DEMO_SKELETON_MINIMUM_DISPLAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return minimumElapsed;
}

export function SkeletonBlock({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden="true" className={`skeleton ${styles.block} ${className}`} style={style} />;
}

function LoadingStatus({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="visually-hidden">Loading…</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

export function TableSkeleton({
  columns,
  rowCount,
  variant,
}: {
  columns: SkeletonColumn[];
  rowCount: number;
  variant: SkeletonVariant;
}) {
  const className = variant === "student" ? styles.studentTable : styles.consoleTable;
  const gridTemplateColumns = columns.map((column) => column.width ?? "minmax(0, 1fr)").join(" ");

  return (
    <div className={`${styles.table} ${className}`}>
      <div className={`${styles.tableHeader} ${styles.tableGrid}`} style={{ gridTemplateColumns }}>
        {columns.map((column) => (
          <div className={styles.headerCell} key={column.label}>
            <SkeletonBlock className={styles.headerBar} style={{ width: "62%" }} />
          </div>
        ))}
      </div>
      <div className={styles.tableBody}>
        {Array.from({ length: rowCount }, (_, rowIndex) => (
          <div className={`${styles.tableRow} ${styles.tableGrid}`} key={rowIndex} style={{ gridTemplateColumns }}>
            {columns.map((column, columnIndex) => (
              <div className={styles.cell} key={column.label}>
                <SkeletonBlock className={styles.cellLabel} style={{ width: `${56 + (columnIndex % 3) * 8}px` }} />
                <SkeletonBlock
                  className={columnIndex === columns.length - 1 ? styles.statusPill : styles.cellBar}
                  style={columnIndex === columns.length - 1 ? undefined : { width: column.barWidth ?? "72%" }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatCardsSkeleton() {
  return (
    <div className={styles.statGrid}>
      {Array.from({ length: 4 }, (_, index) => (
        <div className={styles.statCard} key={index}>
          <SkeletonBlock style={{ width: `${104 + (index % 2) * 20}px`, height: "14px" }} />
          <SkeletonBlock className={styles.statValue} style={{ width: "82px", height: "44px" }} />
        </div>
      ))}
    </div>
  );
}

export function ComplaintDetailsSkeleton() {
  return (
    <LoadingStatus className={styles.details}>
      <div className={styles.detailsTitle}>
        <SkeletonBlock style={{ width: "min(360px, 56vw)", height: "32px" }} />
        <SkeletonBlock className={styles.statusPill} />
      </div>
      <div className={styles.detailGrid}>
        {DETAIL_FIELDS.map((field, index) => (
          <div className={styles.detailField} key={field}>
            <SkeletonBlock style={{ width: `${76 + (index % 2) * 18}px`, height: "12px" }} />
            <SkeletonBlock style={{ width: `${132 + (index % 3) * 24}px`, height: "18px" }} />
          </div>
        ))}
      </div>
      <div className={styles.description}>
        <SkeletonBlock style={{ width: "104px", height: "13px" }} />
        <SkeletonBlock style={{ width: "100%", height: "14px" }} />
        <SkeletonBlock style={{ width: "92%", height: "14px" }} />
        <SkeletonBlock style={{ width: "68%", height: "14px" }} />
      </div>
      <div className={styles.timeline}>
        <SkeletonBlock className={styles.timelineLine} />
        {[0, 1, 2].map((step) => (
          <div className={styles.timelineStep} key={step}>
            <SkeletonBlock className={styles.timelineDot} />
            <SkeletonBlock style={{ width: `${88 + step * 12}px`, height: "12px" }} />
          </div>
        ))}
      </div>
    </LoadingStatus>
  );
}

function StudentPageContent() {
  return (
    <div className="container">
      <div className={`page-head ${styles.studentHead}`}>
        <SkeletonBlock className={styles.studentTitle} />
        <SkeletonBlock className={styles.studentSubtitle} />
      </div>
      <div className={styles.studentTableWrap}>
        <TableSkeleton columns={STUDENT_COLUMNS} rowCount={5} variant="student" />
      </div>
    </div>
  );
}

function ConsolePageContent() {
  return (
    <div className="container">
      <div className={styles.consoleHead}>
        <div className={styles.backLink}>
          <SkeletonBlock style={{ width: "86px", height: "14px" }} />
        </div>
        <div className={styles.consoleTitleRow}>
          <SkeletonBlock className={styles.consoleTitle} />
          <SkeletonBlock className={styles.countPill} />
        </div>
        <SkeletonBlock className={styles.consoleSubtitle} />
      </div>
      <StatCardsSkeleton />
      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <SkeletonBlock className={styles.searchBox} />
          <SkeletonBlock className={styles.filterBox} />
          <SkeletonBlock className={styles.filterBox} />
        </div>
        <div className={styles.consoleTableWrap}>
          <TableSkeleton columns={CONSOLE_COLUMNS} rowCount={6} variant="console" />
        </div>
      </section>
    </div>
  );
}

function PageSkeletonContent({ variant }: { variant: SkeletonVariant }) {
  return variant === "student" ? <StudentPageContent /> : <ConsolePageContent />;
}

export function PageSkeleton({ variant }: { variant: SkeletonVariant }) {
  return (
    <LoadingStatus>
      <PageSkeletonContent variant={variant} />
    </LoadingStatus>
  );
}

export function ShellSkeleton({ variant }: { variant: SkeletonVariant }) {
  return (
    <LoadingStatus className={styles.shell}>
      <header className={styles.shellHeader}>
        <div className={styles.headerLeft}>
          <SkeletonBlock className={styles.menuButton} />
          <SkeletonBlock className={styles.logoBar} />
        </div>
        {variant === "console" ? <SkeletonBlock className={styles.headerLabel} /> : null}
        <SkeletonBlock className={styles.avatar} />
      </header>
      <main className="portal-bg">
        <PageSkeletonContent variant={variant} />
      </main>
    </LoadingStatus>
  );
}
