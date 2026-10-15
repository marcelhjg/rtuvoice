import { Suspense } from "react";
import { Receipt } from "./Receipt";

export default function SubmittedPage() {
  return (
    <Suspense>
      <Receipt />
    </Suspense>
  );
}
