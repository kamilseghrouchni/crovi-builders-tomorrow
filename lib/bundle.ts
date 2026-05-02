import type { InstituteEntry, SpecimenRow } from "@/lib/tools/query_specimens";

export type ProviderType =
  | "ip_platform"        // owns assay IP, runs only their assay (Olink, NanoString)
  | "service_cro"        // multi-assay clinical CRO (Q², Labcorp, ICON)
  | "specialty_cro"      // assay-specialized CRO (GENEWIZ, Diagenode, Metabolon)
  | "vendor";            // hardware/kit vendor (Illumina, 10x, Bruker)

export type Provider = {
  id: string;            // slug
  name: string;
  parent?: string | null;
  type: ProviderType;
  country: string;
  assay_families: string[];
  specific_assays: string[];
  sample_types: string[];
  accreditation: string;
  url?: string;
  services_url?: string;
  evidence?: string;     // NCT IDs, PMC IDs, or web URL
  // ranking signals
  n_trials?: number;
  total_enrollment?: number;
};

export type AssayChoice = {
  assay: string;                   // specific_assay name
  family: string;                  // assay_family
  candidates: Provider[];          // ranked
  selected?: Provider | null;
};

export type Bundle = {
  query: string;                   // raw query text
  samples: {
    institute_ids: string[];
    specimen_ids: string[];
    totals: { specimens: number; donors: number; institutes: number };
  };
  assays: AssayChoice[];
  selected_provider_ids: Record<string, string>;  // assay -> provider.id
};

export type BundleStep = "samples" | "providers" | "summary";

export type ProvidersApiResponse = {
  assays: AssayChoice[];
};
