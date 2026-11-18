// Types shared by adminActions, departmentActions and sharedActions.
// No "use server" here: this file only holds types.

export type ActionState = {
  success: boolean;
  message: string;
};

export type SlaFields = {
  assigned_at: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  ack_due_at: string | null;
  resolve_due_at: string | null; // set once at first assignment
  ack_days: number | null;
  resolve_days: number | null;
};

/* ---------------- evidence files ---------------- */

export type EvidenceUrlState = {
  success: boolean;
  message: string;
  url?: string;
};

// one row returned by get_attachment_for_download
export type EvidenceFileRow = {
  out_path: string;
  out_filename: string | null;
};

/* ---------------- complaint updates ---------------- */

export type ComplaintUpdate = {
  id: string;
  created_at: string;
  message: string;
  department_id: number | null;
  department: string | null;
};

export type ComplaintUpdatesState = {
  success: boolean;
  message: string;
  updates?: ComplaintUpdate[];
};

/* ---------------- summary card counts ---------------- */

export type ComplaintCounts = {
  total: number;
  assigned: number;
  in_progress: number;
  resolved: number;
};

export type ComplaintCountsState = {
  success: boolean;
  message: string;
  counts?: ComplaintCounts;
};

/* ---------------- generic result types ---------------- */

// Discriminated union: after `if (!res.success) return`, TypeScript knows the
// success payload (rows, stats, ...) exists, so no `undefined` checks needed.
export type ActionResult<T = object> =
  | { success: false; message: string }
  | ({ success: true; message?: string } & T);

// payload of the paginated complaint lists (admin + department)
export type ComplaintListData<Row> = {
  rows: Row[];
  total: number;       // follows the search
  statusTotal: number; // header badge
  page: number;
  totalPages: number;
};