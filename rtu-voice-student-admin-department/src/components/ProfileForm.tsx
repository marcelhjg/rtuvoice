"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { PasswordField, TextField } from "./forms/Fields";
import { Icon } from "./Icon";
import { useToast } from "./Toast";
import { ChangePassword, UpdateProfile } from "@/actions/authActions"; // use the file where these actions live
import { passwordChecks, validateConfirm, validateName, validateNewPassword } from "@/lib/validation";
import styles from "./ProfileForm.module.css";

const GENERIC_ERROR = "Something went wrong. Please try again.";

/** Manage Profile. Shared by the student and admin portals; the page passes in the account details. */
export function ProfileForm({ firstName: savedFirst, lastName: savedLast, email }: { firstName: string; lastName: string; email: string }) {
  const router = useRouter();
  const toast = useToast();

  // Account form
  const [firstName, setFirstName] = useState(savedFirst);
  const [lastName, setLastName] = useState(savedLast);
  const [accErrors, setAccErrors] = useState<{ firstName?: string | null; lastName?: string | null }>({});
  const [savingAccount, setSavingAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState(false);

  // After a save, router.refresh() brings in the new saved values.
  useEffect(() => {
    setFirstName(savedFirst);
    setLastName(savedLast);
  }, [savedFirst, savedLast]);

  const accountChanged = firstName.trim() !== savedFirst || lastName.trim() !== savedLast;

  const saveAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (savingAccount) return;
    const next = { firstName: validateName(firstName, "First name"), lastName: validateName(lastName, "Last name") };
    setAccErrors(next);
    if (next.firstName || next.lastName) return;
    if (!accountChanged) {
      toast("No changes to save.");
      setEditingAccount(false);
      return;
    }

    setSavingAccount(true);
    try {
      // These keys must match what UpdateProfile reads.
      const fd = new FormData();
      fd.append("firstName", firstName.trim());
      fd.append("lastName", lastName.trim());
      const res = await UpdateProfile(fd);

      if (res.success) {
        setEditingAccount(false);
        toast("Profile updated.", "success");
        router.refresh(); // re-reads the account so the header shows the new name too
        return;
      }
      const fe = res.errors;
      if (fe?.firstName || fe?.lastName) setAccErrors({ firstName: fe.firstName ?? null, lastName: fe.lastName ?? null });
      else toast(res.message || GENERIC_ERROR, "error");
    } catch (err) {
      console.error(err);
      toast(GENERIC_ERROR, "error");
    } finally {
      setSavingAccount(false);
    }
  };

  const cancelAccountEdit = () => {
    setFirstName(savedFirst);
    setLastName(savedLast);
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

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (savingPw) return;
    const errs = {
      current: current ? null : "Enter your current password.",
      next: validateNewPassword(nextPw) ?? (nextPw && nextPw === current ? "Choose a password different from your current one." : null),
      confirm: validateConfirm(nextPw, confirm),
    };
    setPwErrors(errs);
    if (errs.current || errs.next || errs.confirm) return;

    setSavingPw(true);
    try {
      // These keys must match what ChangePassword reads.
      const fd = new FormData();
      fd.append("oldPassword", current);
      fd.append("newPassword", nextPw);
      fd.append("confirmPassword", confirm);
      const res = await ChangePassword(fd);

      if (res.success) {
        setCurrent("");
        setNextPw("");
        setConfirm("");
        setPwErrors({});
        setEditingPassword(false);
        toast("Password changed.", "success");
        return;
      }
      const fe = res.errors;
      if (fe?.oldPassword || fe?.newPassword || fe?.confirmPassword) {
        setPwErrors({ current: fe.oldPassword ?? null, next: fe.newPassword ?? null, confirm: fe.confirmPassword ?? null });
      } else {
        toast(res.message || GENERIC_ERROR, "error");
      }
    } catch (err) {
      console.error(err);
      toast(GENERIC_ERROR, "error");
    } finally {
      setSavingPw(false);
    }
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
                <input id="profile-email" className={`input ${styles.locked}`} value={email} readOnly aria-describedby="email-hint" />
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