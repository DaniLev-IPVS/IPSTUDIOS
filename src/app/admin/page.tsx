import type { Metadata } from "next";
import { headers } from "next/headers";
import { isAdmin } from "@/lib/guard";
import { listPasses } from "@/lib/passes";
import { storeReady } from "@/lib/store";
import Logo from "@/components/Logo";
import { AdminLogin, CreatePass, PassRow } from "./ui";
import { adminLogout } from "./actions";

export const metadata: Metadata = { title: "Passes — IP Studios", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Admin() {
  if (!(await isAdmin())) {
    return (
      <main className="admin admin-center">
        <AdminLogin />
      </main>
    );
  }
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const passes = storeReady() ? await listPasses() : [];

  return (
    <main className="admin">
      <header className="admin-head">
        <Logo variant="inline" className="admin-logo" />
        <div className="admin-head-r">
          <a href="/main" className="admin-link">Open site</a>
          <form action={adminLogout}>
            <button className="admin-link">Sign out</button>
          </form>
        </div>
      </header>

      <section className="admin-card">
        <h1 className="admin-h">New password link</h1>
        <p className="admin-p">Make one per person. Send them the link and the password; they type the password on the cover to get into the site.</p>
        <CreatePass origin={origin} />
      </section>

      <section className="admin-card">
        <h2 className="admin-h">Links <span className="admin-count">{passes.length}</span></h2>
        {passes.length === 0 ? (
          <p className="admin-p">No links yet.</p>
        ) : (
          <ul className="admin-list">
            {passes.map((p) => (
              <PassRow
                key={p.id}
                id={p.id}
                label={p.label}
                link={`${origin}/?k=${p.token}`}
                createdAt={p.createdAt}
                lastUsedAt={p.lastUsedAt}
                uses={p.uses}
                revoked={p.revoked}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
