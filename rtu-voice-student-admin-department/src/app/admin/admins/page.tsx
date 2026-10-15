"use client";

import { BackToDashboard, adminStyles as s } from "@/components/admin/bits";
import { Icon } from "@/components/Icon";
import { useDemoStore } from "@/lib/demo-store";
import { formatLongDate } from "@/lib/format";
import styles from "./admins.module.css";

/** View Admin: the administrator accounts. Accounts are created manually, not through sign-up. */
export default function ViewAdminPage() {
  const { admins, session } = useDemoStore();
  return (
    <div className="container">
      <div className={s.head}>
        <BackToDashboard />
        <div className={s.listTitleRow}>
          <h1 className={s.listTitle}>Administrators</h1>
          <span className={`${s.countPill} ${s.pillTotal}`}>{admins.length}</span>
        </div>
        <p className={s.subtitle}>Accounts that can open the Central Admin Console.</p>
      </div>

      <section className={s.panel} aria-label="Administrator accounts">
        <p className={`alert alert-info ${styles.info}`}>
          <Icon name="info" size={18} />
          <span>Administrator accounts are created by the Super Admin. They cannot be created through public sign-up.</span>
        </p>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <caption className="visually-hidden">Administrator accounts</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Added</th>
                <th scope="col">Last active</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const you = session?.email === a.email;
                return (
                  <tr key={a.email}>
                    <td data-label="Name">
                      <span className={styles.person}>
                        <span className={styles.initial} aria-hidden="true">
                          {a.firstName.charAt(0)}
                        </span>
                        <span className={s.strong}>
                          {a.firstName} {a.lastName}
                          {you ? <span className={styles.you}> (you)</span> : null}
                        </span>
                      </span>
                    </td>
                    <td data-label="Email">{a.email}</td>
                    <td data-label="Role">
                      <span className={`${s.pill} ${a.active === false ? styles.deactivated : styles.admin}`}>{a.active === false ? "Deactivated" : a.title}</span>
                    </td>
                    <td data-label="Added" className={s.date}>
                      {formatLongDate(a.addedAt)}
                    </td>
                    <td data-label="Last active" className={s.date}>
                      {formatLongDate(a.lastActiveAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
