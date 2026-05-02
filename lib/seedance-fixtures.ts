/**
 * Cached Seedance fixtures — videos we've already paid to render and want
 * to serve instantly when a request matches the trigger conditions.
 *
 * Two flavours:
 *   • sponsor pre-roll  — fired during search, plays over results
 *   • kickoff brief     — fired after Launch agent, sent to provider + institutes
 *
 * The /api/seedance/{start,kickoff} routes consult this registry first.
 * If a fixture matches, they return a synthetic task_id of the form
 * "demo:<id>" which /api/seedance/status resolves to the static mp4.
 */

export type SponsorFixture = {
  id: string;
  task_id: string;             // demo:<id>
  public_url: string;          // path under /public
  duration_s: number;
  sponsor: { name: string; country: string | null; type: string; url: string | null };
  assay: string;
  family: string;
  /** True when this fixture should serve the request. */
  matches: (input: SponsorMatchInput) => boolean;
};

export type SponsorMatchInput = {
  query: string;
  assays: { assay: string; family: string }[];
};

export type KickoffFixture = {
  id: string;
  task_id: string;
  public_url: string;
  duration_s: number;
  /** "Sent to" line shown in overlay UI. */
  pitch: { provider_name: string; provider_country: string | null; assays: string[]; n_specimens: number; n_donors: number; n_institutes: number };
  matches: (input: KickoffMatchInput) => boolean;
};

export type KickoffMatchInput = {
  provider_name: string | null;
  assays: string[];                  // names of assays in the bundle
  n_specimens: number;
  n_donors: number;
  n_institutes: number;
};

// ─── SPONSOR pre-roll fixtures ───────────────────────────────────────────────
export const SPONSOR_FIXTURES: SponsorFixture[] = [
  {
    id: "anchordx-commercial",
    task_id: "demo:anchordx-commercial",
    public_url: "/sponsor-demos/anchordx-commercial.mp4",
    duration_s: 10,
    sponsor: {
      name: "AnchorDx Medical Co., Ltd.",
      country: "CN",
      type: "ip_platform",
      url: "https://www.anchordx.com/",
    },
    assay: "ctDNA methylation profiling",
    family: "Epigenomics",
    matches: ({ assays }) =>
      assays.some(
        (a) =>
          a.family === "Epigenomics" ||
          a.assay === "Methylation array (EPIC)" ||
          a.assay === "ctDNA methylation profiling" ||
          a.assay === "Whole genome bisulfite sequencing (WGBS)",
      ),
  },
];

// ─── KICKOFF briefing fixtures ───────────────────────────────────────────────
export const KICKOFF_FIXTURES: KickoffFixture[] = [
  {
    id: "eurofins-methylation-rnaseq",
    task_id: "demo:eurofins-kickoff",
    public_url: "/sponsor-demos/eurofins-kickoff.mp4",
    duration_s: 15,
    pitch: {
      provider_name: "Eurofins Genomics + Biopharma",
      provider_country: "LU",
      assays: ["Methylation array (EPIC)", "Bulk RNA sequencing"],
      n_specimens: 1800,
      n_donors: 1000,
      n_institutes: 2,
    },
    matches: ({ provider_name, assays }) => {
      // primary trigger: Eurofins is the chosen provider
      if (provider_name && /eurofins/i.test(provider_name)) return true;
      // secondary trigger: query has the methylation + RNA-seq combo this fixture was cut for
      const lower = assays.map((a) => a.toLowerCase());
      const hasMeth = lower.some((a) => a.includes("methylation"));
      const hasRna = lower.some((a) => a.includes("rna sequencing") || a.includes("rna-seq"));
      return hasMeth && hasRna;
    },
  },
];

export function findSponsorFixture(input: SponsorMatchInput): SponsorFixture | null {
  for (const f of SPONSOR_FIXTURES) {
    if (f.matches(input)) return f;
  }
  return null;
}

export function findKickoffFixture(input: KickoffMatchInput): KickoffFixture | null {
  for (const f of KICKOFF_FIXTURES) {
    if (f.matches(input)) return f;
  }
  return null;
}

/** Map a synthetic demo task_id to its public mp4 path. */
export function fixtureUrlForTask(taskId: string): string | null {
  for (const f of SPONSOR_FIXTURES) if (f.task_id === taskId) return f.public_url;
  for (const f of KICKOFF_FIXTURES) if (f.task_id === taskId) return f.public_url;
  return null;
}
