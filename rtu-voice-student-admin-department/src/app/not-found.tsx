import { NotFoundActions } from "@/components/NotFoundActions";
import { PublicHeader } from "@/components/PublicHeader";

export default function NotFound() {
  return (
    <>
      <PublicHeader />
      <main
        id="main"
        className="portal-bg"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 16px", textAlign: "center" }}
      >
        <div>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 96, lineHeight: 1, color: "var(--blue)" }}>404</p>
          <h1 className="page-title" style={{ marginTop: 16 }}>
            Page not found
          </h1>
          <p className="page-subtitle">The page you are looking for does not exist or has moved.</p>
          <NotFoundActions />
        </div>
      </main>
    </>
  );
}
