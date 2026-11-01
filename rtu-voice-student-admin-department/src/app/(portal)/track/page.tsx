import { Suspense } from "react";
import { Tracker } from "./Tracker";

export default function TrackPage() {
  return (
    <Suspense>
      <Tracker />
    </Suspense>
  );
}
