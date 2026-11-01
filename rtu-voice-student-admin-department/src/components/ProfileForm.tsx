"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PasswordField, TextField } from "./forms/Fields";
import { Icon } from "./Icon";
import { useToast } from "./Toast";
import { useDemoStore } from "@/lib/demo-store";
import { passwordChecks, validateConfirm, validateName, validateNewPassword } from "@/lib/validation";
import styles from "./ProfileForm.module.css";

/** Manage Profile (Figma: MANAGE PROFILE). Shared by the student and admin portals. */
export function ProfileForm() {
  const { session, updateProfile } = useDemoStore();
  const toast = useToast();

  // Account form
  const [firstName, setFirstName] = useState(session?.firstName ?? "");
  const [lastName, setLastName] = useState(session?.lastName ?? "");
  const [accErrors, setAccErrors] = useState<{ firstName?: string | null; lastName?: string | null }>({});
  const [savingAccount, setSavingAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState(false);

  useEffect(() => {
    if (session) {
      setFirstName(session.firstName);
      setLastName(session.lastName);
    }
  }, [session]);

  const accountChanged = !!session && (firstName.trim() !== session.firstName || lastName.trim() !== session.lastName);

  const saveAccount = (e: FormEvent) => {
    e.preventDefault();
    const next = { firstName: validateName(firstName, "First name"), lastName: validateName(lastName, "Last name") };
    setAccErrors(next);
    if (next.firstName || next.lastName) return;
    if (!accountChanged) {
      toast("No changes to save.");
      setEditingAccount(false);
      return;
    }
    setSavingAccount(true);
    window.setTimeout(() => {
      updateProfile(firstName, lastName);
      setSavingAccount(false);
      setEditingAccount(false);
      toast("Account details saved (demo: stored in this browser only).", "success");
    }, 500);
  };

  const cancelAccountEdit = () => {
    setFirstName(session?.firstName ?? "");
    setLastName(session?.lastName ?? "");
    setAccErrors({});
    setEditingAccount(false);
  };

  // Password form
  const [current, setCurrent] = useState("");
  const [nextPw, setNextPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwErrors, setPwErrors] = useState<{ current?: string | null; next?: string | null; confirm?: string | null }>({});
  const [savingPw, setSavingPw] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);

  const savePassword = (e: FormEvent) => {
    e.preventDefault();
    const errs = {
      current: current ? null : "Enter your current password.",
      next: validateNewPassword(nextPw) ?? (nextPw && nextPw === current ? "Choose a password different from your current one." : null),
      confirm: validateConfirm(nextPw, confirm),
    };
    setPwErrors(errs);
    if (errs.current || errs.next || errs.confirm) return;
    setSavingPw(true);
    // SIMULATED: the current password is not checked and nothing is stored.
    window.setTimeout(() => {
      setSavingPw(false);
      setCurrent("");
      setNextPw("");
      setConfirm("");
      setPwErrors({});
      setEditingPassword(false);
      toast("Password changed (demo: no password is actually stored).", "success");
    }, 600);
  };

  const cancelPasswordEdit = () => {
    setCurrent("");
    setNextPw("");
    setConfirm("");
    setPwErrors({});
    setEditingPassword(false);
  };

  return (
    <div className="container">
      <div className="page-head">
        <h1 className="page-title">Manage Profile</h1>
        <p className="page-subtitle" style={{ fontSize: 16 }}>
          Your account details and password.
        </p>
      </div>

      <div className={styles.grid}>
        <form className={styles.card} onSubmit={saveAccount} noValidate aria-labelledby="account-title">
          <div className={styles.cardHeading}>
            <h2 id="account-title" className={styles.cardTitle}>
              Account
            </h2>
            {!editingAccount ? (
              <button type="button" className={styles.editButton} onClick={() => setEditingAccount(true)}>
                <Icon name="pencil" size={18} /> Edit Profile
              </button>
            ) : null}
          </div>
          <div className={styles.fields}>
            <div className={styles.row2}>
              <TextField
                label="First Name"
                markRequired
                autoComplete="given-name"
                value={firstName}
                disabled={!editingAccount || savingAccount}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (accErrors.firstName) setAccErrors((x) => ({ ...x, firstName: null }));
                }}
                error={accErrors.firstName}
                inputClassName={styles.input}
              />
              <TextField
                label="Last Name"
                markRequired
                autoComplete="family-name"
                value={lastName}
                disabled={!editingAccount || savingAccount}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (accErrors.lastName) setAccErrors((x) => ({ ...x, lastName: null }));
                }}
                error={accErrors.lastName}
                inputClassName={styles.input}
              />
            </div>
            <div className="field">
              <label htmlFor="profile-email" className="field-label">
                RTU email
              </label>
              <div className="input-wrap">
                <input id="profile-email" className={`input ${styles.locked}`} value={session?.email ?? ""} readOnly aria-describedby="email-hint" />
                <Icon name="lock" size={20} className="input-lock" />
              </div>
              <span id="email-hint" className="field-hint">
                Your email cannot be changed.
              </span>
            </div>
          </div>
          {editingAccount ? (
            <div className={styles.actions}>
              <button type="button" className={`btn btn-soft ${styles.cancel}`} onClick={cancelAccountEdit} disabled={savingAccount}>
                Cancel
              </button>
              <button type="submit" className={`btn btn-primary ${styles.save}`} disabled={savingAccount}>
                {savingAccount ? <span className="spinner" /> : null}
                Save Changes
              </button>
            </div>
          ) : null}
        </form>

        <form className={styles.card} onSubmit={savePassword} noValidate aria-labelledby="password-title">
          <div className={styles.cardHeading}>
            <h2 id="password-title" className={styles.cardTitle}>
              Change Password
            </h2>
            {!editingPassword ? (
              <button type="button" className={styles.editButton} onClick={() => setEditingPassword(true)}>
                <Icon name="pencil" size={18} /> Edit Password
              </button>
            ) : null}
          </div>
          <div className={styles.fields}>
            <PasswordField
              label="Current Password"
              markRequired
              autoComplete="current-password"
              placeholder="Enter current password"
              value={current}
              disabled={!editingPassword || savingPw}
              onChange={(e) => {
                setCurrent(e.target.value);
                if (pwErrors.current) setPwErrors((x) => ({ ...x, current: null }));
              }}
              error={pwErrors.current}
              inputClassName={styles.input}
            />
            <PasswordField
              label="New Password"
              markRequired
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={nextPw}
              disabled={!editingPassword || savingPw}
              onChange={(e) => {
                setNextPw(e.target.value);
                if (pwErrors.next) setPwErrors((x) => ({ ...x, next: null }));
              }}
              error={pwErrors.next}
              inputClassName={styles.input}
            />
            {nextPw ? (
              <ul className={styles.reqs} aria-label="Password requirements">
                {passwordChecks(nextPw).map((c) => (
                  <li key={c.label} className={c.ok ? styles.reqOk : undefined}>
                    <Icon name={c.ok ? "check" : "x"} size={12} strokeWidth={2.6} />
                    {c.label}
                  </li>
                ))}
              </ul>
            ) : null}
            <PasswordField
              label="Confirm New Password"
              markRequired
              autoComplete="new-password"
              placeholder="Re-enter new password"
              value={confirm}
              disabled={!editingPassword || savingPw}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (pwErrors.confirm) setPwErrors((x) => ({ ...x, confirm: null }));
              }}
              error={pwErrors.confirm}
              inputClassName={styles.input}
            />
          </div>
          {editingPassword ? (
            <div className={styles.actions}>
              <button type="button" className={`btn btn-soft ${styles.cancel}`} onClick={cancelPasswordEdit} disabled={savingPw}>
                Cancel
              </button>
              <button type="submit" className={`btn btn-outline ${styles.save}`} disabled={savingPw}>
                {savingPw ? <span className="spinner" /> : null}
                Save Changes
              </button>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
