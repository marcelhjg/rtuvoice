"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/Toast";
import { useDemoStore } from "@/lib/demo-store";

/**
 * Failed-load notice. The demo keeps its data in this browser; if the saved data was corrupted or the
 * browser blocks storage, the store starts from the demo data and this says so once (instead of failing
 * silently).
 */
export function StorageNotice() {
  const { storageProblem } = useDemoStore();
  const toast = useToast();
  const shown = useRef<string | null>(null);

  useEffect(() => {
    if (!storageProblem || shown.current === storageProblem) return;
    shown.current = storageProblem;
    toast(
      storageProblem === "unreadable"
        ? "Your saved demo data couldn't be read, so the demo data was loaded again."
        : "This browser isn't saving the demo data. Changes will be lost when you close or reload the tab.",
      "error",
    );
  }, [storageProblem, toast]);

  return null;
}
