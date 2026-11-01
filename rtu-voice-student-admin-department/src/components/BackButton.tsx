"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import styles from "./BackButton.module.css";

export function BackButton() {
  const router = useRouter();

  const goBack = () => {
    const referrer = document.referrer;
    const hasSameOriginReferrer =
      referrer !== "" && new URL(referrer, window.location.href).origin === window.location.origin;

    if (window.history.length > 1 && hasSameOriginReferrer) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <button type="button" className={styles.button} onClick={goBack} aria-label="Go back">
      <ArrowLeft size={16} aria-hidden="true" />
      <span>Back</span>
    </button>
  );
}
