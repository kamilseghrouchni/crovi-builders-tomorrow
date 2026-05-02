import type { Provider } from "@/lib/bundle";

/**
 * Per assay-family scene vocabulary the model can render.
 * Each entry gives multiple distinct shots so a longer clip has variety.
 */
const FAMILY_VISUALS: Record<string, string[]> = {
  Genomics: [
    "Illumina NovaSeq sequencing rack, glowing flow cells",
    "DNA double helix abstract animation",
    "scientist in white coat loading sample tubes into a centrifuge",
    "cluster heatmap of variants on a high-resolution monitor",
  ],
  Epigenomics: [
    "Infinium MethylationEPIC BeadChip slide, microscopic CpG site visualisation",
    "blue fluorescent imaging of methylated cytosines",
    "robotic pipettor dispensing bisulfite reagent into 96-well plate",
    "world map highlighting validated cohorts, methylation patterns flowing",
  ],
  Transcriptomics: [
    "RNA-seq libraries clustering on an Illumina flow cell",
    "real-time gene-expression heatmap with rising and falling bars",
    "single-cell UMAP plot animating into clusters",
    "lab automation arm transferring 384-well plates",
  ],
  Proteomics: [
    "Bruker timsTOF mass spectrometer, plasma vials in autosampler",
    "peptide chromatograph traces resolving across a monitor",
    "Olink panel proximity-extension assay illustration",
    "lab tech reviewing a protein abundance dashboard",
  ],
  Metabolomics: [
    "LC-MS instrument autosampler with plasma vials",
    "metabolite chromatography peaks resolving in real time",
    "molecular structure overlays of pathway nodes",
    "scientist observing a results dashboard with confidence intervals",
  ],
  Microbiome: [
    "stool sample tubes in a barcoded rack",
    "agar plates revealing colony diversity, time-lapse",
    "16S rRNA gene tree of life visualisation",
    "sequencing center with rows of MiSeq instruments",
  ],
  Immunomics: [
    "Adaptive ImmunoSEQ workflow, B/T cell receptor schematic",
    "flow cytometer scattering rainbow of cell populations",
    "immune repertoire spectratype animation",
    "monitor showing MRD curve over time",
  ],
  "Spatial proteomics": [
    "Akoya PhenoCycler multiplex IF tumor section, 30+ markers cycling",
    "fluorescent microscope autofocusing on a tissue slide",
    "cell segmentation overlay revealing immune neighbourhoods",
    "high-resolution monitor displaying spatial atlas",
  ],
};

const FAMILY_DEFAULT = [
  "modern clinical laboratory, freezer racks, sample tubes",
  "lab tech in PPE moving between instruments",
];

/**
 * Per specific_assay capability bullets. Used as on-screen text beats
 * during the commercial. Real, defensible feature claims.
 */
const ASSAY_FEATURES: Record<string, string[]> = {
  "Methylation array (EPIC)": [
    "850,000 CpG sites",
    "FFPE-compatible",
    "Population-scale validated",
  ],
  "Whole genome bisulfite sequencing (WGBS)": [
    "Single-base resolution",
    "Full methylome coverage",
    "Reference-grade",
  ],
  "ctDNA methylation profiling": [
    "Single blood draw",
    "Cancer-specific signatures",
    "Clinically validated",
  ],
  "Whole genome sequencing (WGS)": [
    "30× coverage",
    "Structural variant detection",
    "Clinical-grade pipeline",
  ],
  "Whole exome sequencing (WES)": [
    "All protein-coding regions",
    "Twist or Agilent capture",
    "Validated tumor variants",
  ],
  "Targeted gene panel sequencing": [
    "500+ cancer genes",
    "TMB / MSI / CNV / fusions",
    "Therapy-selection ready",
  ],
  "Cell-free DNA / liquid biopsy DNA": [
    "Non-invasive",
    "MRD-grade sensitivity",
    "Serial monitoring",
  ],
  "Long-read sequencing": [
    "PacBio HiFi / ONT",
    "Phasing + structural variants",
    "Native methylation",
  ],
  "Bulk RNA sequencing": [
    "FFPE & frozen tissue",
    "Differential expression",
    "Immune deconvolution",
  ],
  "Single-cell RNA sequencing": [
    "10x Chromium",
    "Cell-type atlasing",
    "Trajectory inference",
  ],
  "Spatial transcriptomics": [
    "Visium / Xenium",
    "Tissue context preserved",
    "Multi-modal capable",
  ],
  "Targeted RNA panel (nCounter)": [
    "PAM50 subtyping",
    "FFPE robust",
    "No amplification bias",
  ],
  "LC-MS/MS proteomics (DIA/TMT)": [
    "Thousands of proteins",
    "Quantitative DIA",
    "Plasma-deep coverage",
  ],
  "Olink (PEA panels)": [
    "5,000+ proteins",
    "Specific dual-antibody capture",
    "UK Biobank validated",
  ],
  "SomaScan (aptamer)": [
    "11,000-protein menu",
    "Slow-off rate aptamers",
    "Plasma & CSF",
  ],
  "Multiplex immunoassay": [
    "Cytokine panels",
    "Luminex / MSD",
    "Validated reference ranges",
  ],
  "Mass cytometry (CyTOF)": [
    "40+ markers per cell",
    "Deep immune phenotyping",
    "Standard BioTools Helios",
  ],
  "Untargeted LC-MS metabolomics": [
    "5,400+ metabolites",
    "Pathway-level insights",
    "CAP/CLIA grade",
  ],
  "Targeted metabolomics": [
    "Biocrates MxP Quant 500",
    "Absolute quantification",
    "Multi-matrix",
  ],
  "NMR metabolomics": [
    "Nightingale 250+ markers",
    "UK Biobank scale",
    "Reproducible across sites",
  ],
  Lipidomics: [
    "Hundreds of lipid species",
    "Class-resolved",
    "Plasma & tissue",
  ],
  "16S rRNA gene sequencing": [
    "Genus-level resolution",
    "Stool & swabs",
    "Standardised pipelines",
  ],
  "Shotgun metagenomics": [
    "Strain-level resolution",
    "Functional annotation",
    "Antimicrobial resistance",
  ],
  "T-cell receptor sequencing": [
    "Adaptive ImmunoSEQ",
    "Repertoire diversity",
    "MRD-capable",
  ],
  "Flow cytometry": [
    "Custom panels",
    "Receptor occupancy",
    "Rare-event detection",
  ],
  "Multiplex immunofluorescence": [
    "30+ markers per slide",
    "Tumor microenvironment",
    "FDA-aligned workflows",
  ],
  "Imaging mass cytometry": [
    "Hyperion subcellular",
    "40-marker tissue panels",
    "Spatial-resolved",
  ],
};

const ASSAY_FEATURE_DEFAULT = [
  "Validated workflows",
  "Clinical-grade output",
];

export type SponsorPromptInput = {
  query: string;                 // raw user query (or parsed_text)
  assay: string;                 // specific_assay
  family: string;                // assay_family
  provider: Provider;            // chosen sponsor
  evidenceLine?: string;         // optional override for proof line
  duration?: number;             // seconds (informs scene count). Default 10.
};

/**
 * Produces a commercial-style Seedance prompt.
 * Structure (≈10s):
 *   0–2s  Opening establishing shot of the modality
 *   2–6s  Capability beats — three on-screen feature callouts cycling
 *   6–8s  Trust frame — evidence (n trials / accreditation)
 *   8–10s Brand close — provider name + tagline + URL hint
 */
export function buildSponsorPrompt(input: SponsorPromptInput): string {
  const dur = input.duration ?? 10;
  const visuals = FAMILY_VISUALS[input.family] ?? FAMILY_DEFAULT;
  const features = ASSAY_FEATURES[input.assay] ?? ASSAY_FEATURE_DEFAULT;

  const country = input.provider.country && input.provider.country !== "—" ? input.provider.country : null;
  const accred =
    input.provider.accreditation && input.provider.accreditation !== "—"
      ? input.provider.accreditation.replace(/\s*\(.*?\)/g, "").trim()
      : null;
  const tagline = input.evidenceLine ?? buildEvidenceLine(input.provider) ?? `${input.assay} done right`;

  const providerLine = country ? `${input.provider.name}, ${country}` : input.provider.name;

  // Pick 3 visuals to anchor distinct scenes
  const v1 = visuals[0] ?? FAMILY_DEFAULT[0];
  const v2 = visuals[1] ?? visuals[0] ?? FAMILY_DEFAULT[0];
  const v3 = visuals[2] ?? visuals[1] ?? FAMILY_DEFAULT[0];

  const f1 = features[0] ?? "Validated workflow";
  const f2 = features[1] ?? "Clinical-grade output";
  const f3 = features[2] ?? "Trusted at scale";

  return [
    `Polished ${dur}-second commercial in the style of a biotech product reel.`,
    `Brand: ${providerLine}. Product: ${input.assay} (${input.family.toLowerCase()}).`,
    "Pacing: 4 cuts, smooth motion, hopeful score, sans-serif on-screen text.",
    `Scene 1 (0–${Math.round(dur * 0.2)}s): wide establishing shot — ${v1}.`,
    `Scene 2 (${Math.round(dur * 0.2)}–${Math.round(dur * 0.5)}s): close-up — ${v2}, on-screen text "${f1}" fades in.`,
    `Scene 3 (${Math.round(dur * 0.5)}–${Math.round(dur * 0.8)}s): cut to ${v3}, on-screen text "${f2}" then "${f3}" cycle.`,
    `Scene 4 (${Math.round(dur * 0.8)}–${dur}s): brand close — clean white card with bold serif headline "${input.provider.name}", subline "${tagline}"${accred ? `, small mono "${accred}"` : ""}.`,
    "Look: warm clinical, slight teal-orange grade, shallow depth of field, professional, modern. Ad-clear, not subtle — this is a sponsor message.",
  ].join(" ");
}

export function buildEvidenceLine(p: Provider): string | undefined {
  if (p.n_trials && p.total_enrollment) {
    return `Validated across ${p.n_trials} trial${p.n_trials === 1 ? "" : "s"} · ${p.total_enrollment.toLocaleString()} patients`;
  }
  if (p.accreditation && p.accreditation !== "—") {
    return p.accreditation.replace(/\s*\(.*?\)/g, "").trim();
  }
  return undefined;
}
