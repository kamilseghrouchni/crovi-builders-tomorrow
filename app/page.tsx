import fs from "node:fs";
import path from "node:path";
import { LandingForm } from "./LandingForm";

type Curated = { id: string; role: string; label: string; text: string; bundle_id: string; expected_difficulty: string };

function loadCurated(): Curated[] {
  const p = path.join(process.cwd(), "data", "enriched", "curated_queries.json");
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export default function Page() {
  const curated = loadCurated();
  return (
    <main className="landing">
      <header className="landing-hd">
        <h1 className="serif">Crovi</h1>
        <span className="sub">Talk to the biobank network. The agent finds the samples.</span>
      </header>

      <LandingForm curated={curated} />

      <footer style={{ display: "flex", gap: 14, color: "var(--text-3)", fontSize: 11 }}>
        <span className="mono">486,754 specimens · 161,374 donors · 18 institutes</span>
        <span style={{ marginLeft: "auto" }} className="mono">MVP · curated demo set</span>
      </footer>
    </main>
  );
}
