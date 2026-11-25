"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChangePassword, UpdateProfile } from "@/actions/authActions";
import { useCurrentUser } from "./portal/CurrentUserContext";
import { PasswordField, TextField } from "./forms/Fields";
import { Icon } from "./Icon";
import { useToast } from "./Toast";
import { passwordChecks, validateConfirm, validateName, validateNewPassword } from "@/lib/validation";
import styles from "./ProfileForm.module.css";

const ROLE_LABELS = {
  student: "Student Portal",
  admin: "Central Admin Console",
  department: "Department Portal",
  superadmin: "Super Admin Console",
} as const;

/** Manage Profile. Shared by the student, admin, department and super admin portals. */
export function ProfileForm() {
  const user = useCurrentUser();
  const router = useRouter();
  const toast = useToast();

  // Account form
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [accErrors, setAccErrors] = useState<{ firstName?: string | null; lastName?: string | null }>({});
  const [savingAccount, setSavingAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState(false);

  // after router.refresh() the layout passes the new names down
  useEffect(() => {
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
  }, [user.firstName, user.lastName]);

  const accountChanged = firstName.trim() !== (user.firstName ?? "") || lastName.trim() !== (user.lastName ?? "");
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Your profile";

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
      const fd = new FormData();
      fd.set("firstName", firstName.trim());
      fd.set("lastName", lastName.trim());
      const res = await UpdateProfile(fd);
      if (!res.success) {
        setAccErrors({ firstName: res.errors?.firstName ?? null, lastName: res.errors?.lastName ?? null });
        if (!res.errors) toast(res.message || "Couldn't save your details.", "error");
        return;
      }
      setEditingAccount(false);
      toast("Account details saved.", "success");
      router.refresh(); // the header's name comes from the server layout
    } catch {
      toast("Something went wrong. Please try again.", "error");
    } finally {
      setSavingAccount(false);
    }
  };

  const cancelAccountEdit = () => {
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
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
      const fd = new FormData();
      fd.set("oldPassword", current);
      fd.set("newPassword", nextPw);
      fd.set("confirmPassword", confirm);
      const res = await ChangePassword(fd);
      if (!res.success) {
        setPwErrors({
          current: res.errors?.oldPassword ?? null,
          next: res.errors?.newPassword ?? null,
          confirm: res.errors?.confirmPassword ?? null,
        });
        if (!res.errors) toast(res.message || "Couldn't change your password.", "error");
        return;
      }
      setCurrent("");
      setNextPw("");
      setConfirm("");
      setPwErrors({});
      setEditingPassword(false);
      toast("Password changed.", "success");
    } catch {
      toast("Something went wrong. Please try again.", "error");
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
    <div className={`container ${styles.page}`}>
      <div className="page-head">
        <h1 className="page-title">Manage Profile</h1>
        <p className="page-subtitle">Your account details and password.</p>
      </div>

      <section className={styles.grid} aria-labelledby="profile-name">
        <div className={styles.card}>
          <header className={styles.profileHeader}>
            <span className={styles.avatar} aria-hidden="true">
              <Icon name="user" size={26} strokeWidth={1.7} />
            </span>
            <div className={styles.profileIdentity}>
              <h2 id="profile-name" className={styles.profileName}>{fullName}</h2>
              <p className={styles.profileRole}>{ROLE_LABELS[user.role]}</p>
            </div>
            {!editingAccount ? (
              <button type="button" className={styles.editButton} onClick={() => setEditingAccount(true)}>
                <Icon name="pencil" size={16} /> Edit Profile
              </button>
            ) : null}
          </header>

          <form className={styles.accountForm} onSubmit={saveAccount} noValidate aria-label="Account details">
            <h3 className={styles.accountSectionTitle}>Your Account Details</h3>
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
                  <input id="profile-email" className={`input ${styles.locked}`} value={user.email ?? ""} readOnly aria-describedby="email-hint" />
                  <Icon name="lock" size={18} className="input-lock" />
                </div>
                <span id="email-hint" className="field-hint">
                  Your email cannot be changed.
                  {user.role === "student" ? (
                    <>
                      {" "}If it is incorrect, request a correction from the privacy contact at{" "}
                      <a href="mailto:2024-200380@rtu.edu.ph">2024-200380@rtu.edu.ph</a>. See the{" "}
                      <Link href="/privacy">Privacy Notice</Link>.
                    </>
                  ) : null}
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

          <form className={styles.passwordForm} onSubmit={savePassword} noValidate aria-labelledby="password-title">
            <div className={styles.passwordSummary}>
              <div className={styles.passwordIntro}>
                <h3 id="password-title" className={styles.passwordTitle}>Password</h3>
                <p className={styles.passwordHint}>Keep your account secure by updating your password.</p>
              </div>
              {!editingPassword ? (
                <button type="button" className={styles.changeButton} onClick={() => setEditingPassword(true)}>
                  Change password
                </button>
              ) : null}
            </div>
            {editingPassword ? (
              <>
                <div className={styles.passwordFields}>
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
                </div>
                <div className={styles.actions}>
                  <button type="button" className={`btn btn-soft ${styles.cancel}`} onClick={cancelPasswordEdit} disabled={savingPw}>
                    Cancel
                  </button>
                  <button type="submit" className={`btn btn-outline ${styles.save}`} disabled={savingPw}>
                    {savingPw ? <span className="spinner" /> : null}
                    Save Changes
                  </button>
                </div>
              </>
            ) : null}
          </form>
        </div>
      </section>
    </div>
  );
}
