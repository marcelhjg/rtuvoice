import { RouteLoading } from "@/components/RouteStates";
import styles from "./auth.module.css";

// Shown in the card column (the "Your Voice Matters" side stays) while the next auth step loads.
export default function Loading() {
  return (
    <div className={styles.card} aria-busy="true">
      <RouteLoading compact />
    </div>
  );
}
