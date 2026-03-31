# Intelligence Dimensions

Every cohort recommendation must go beyond "this cohort exists" to
"here is what it means for your project." These are the dimensions
we extract and the implications we surface.

## 1. Sample usability

**What we find:** sample medium (plasma/serum/whole blood), tube type
(EDTA/heparin/SST), fasting status, storage temp, freeze-thaw cycles,
collection protocol.

**What it means for the user:**
- Fasting plasma in EDTA at -80C → compatible with standard LC/MS
  metabolomics. Results comparable to most published AD work.
- Non-fasting or serum → 30% of metabolites shift with feeding status.
  Cross-study comparison becomes unreliable. Must be flagged.
- Storage at -20C or unspecified → degradation risk for labile
  metabolites (oxidised lipids, short-chain acylcarnitines). May
  limit what you can measure.
- Already processed by Metabolon/Biocrates → raw data may exist.
  Could avoid re-running the assay entirely and just access data.

## 2. Real numbers vs headline numbers

**What we find:** total cohort N, breakdown by diagnostic group,
number with the requested sample type, number with complete
longitudinal data, number after QC exclusions.

**What it means for the user:**
- UK Biobank says 274,259 but your AD subset is ~2,300. The model
  you can train is 100x smaller than the headline.
- ADNI says 1,517 but the MCI conversion signal (the part that
  predicts AD) is 329 converters. That is your real training set.
- Always give the usable number for THIS request, not the number
  from the abstract. The customer plans their study on this.

## 3. Longitudinal structure

**What we find:** number of timepoints, interval between visits,
dropout rate per timepoint, which timepoints have metabolomics
data, when diagnostic conversion happens.

**What it means for the user:**
- Baseline n=1,393, 12mo n=1,188, 24mo n=1,089 → 22% dropout by
  year 2. Longitudinal models must account for attrition.
- Most participants have 3 measurements → power for trajectory
  analysis is limited. If the user needs 5+ timepoints, this
  cohort is not deep enough.
- AD conversion AUC improves from 0.83 at baseline to 0.91 at
  24 months → the metabolic signal strengthens with disease
  progression. For early detection, the realistic benchmark is
  AUC 0.70 for MCI conversion at baseline.
- Sparse data beyond 7 visits → long-term progression modelling
  is not feasible with this cohort.

## 4. Medication and lifestyle confounders

**What we find:** statin use %, omega-3 supplementation, metformin,
anti-hypertensives, alcohol, smoking, diet, exercise.

**What it means for the user:**
- 45% statin use in AD group → statins reshape the lipidome.
  If the paper adjusted for this, good. If not, top metabolomics
  hits may be statin effects, not disease effects.
- High omega-3 supplementation → shifts fatty acid profiles.
  Must be included as a covariate.
- If the user's own study population has different medication
  patterns, the model may not transfer.

## 5. Demographic composition

**What we find:** age distribution, sex ratio, APOE genotype
distribution, ethnicity/ancestry breakdown, socioeconomic factors.

**What it means for the user:**
- 91% White → model will not generalise to diverse populations.
  If the customer targets global markets, complement with
  Knight ADRC (multi-ancestry) or AIBL (Australian).
- 53% APOE e4 in AD group → genotype-stratified analysis is
  possible. The customer can build APOE-specific models.
- Mean age 74 → findings may not apply to early-onset AD (<65).
- Sex ratio 46% female → sex-stratified metabolomics is feasible
  but may be underpowered per group.

## 6. Co-modalities (multi-omics value)

**What we find:** what else has been measured on the same
participants: genomics, proteomics, imaging (MRI, PET),
CSF biomarkers, clinical assessments.

**What it means for the user:**
- Amyloid PET on 742 of the same patients → can cross-reference
  metabolomics hits against amyloid status. Multi-modal validation
  that metabolomics-only cohorts cannot offer.
- CSF p-tau on 1,009 → can validate blood metabolomics against
  the gold-standard AD biomarker.
- GWAS data available → can do metabolomics QTL analysis, linking
  genetic variants to metabolite levels in an AD context.
- No co-modalities → the cohort is metabolomics-only. Findings
  are harder to validate and less publishable.

## 7. Effect sizes and model performance

**What we find:** reported AUCs, odds ratios, fold changes,
p-values, confidence intervals, comparison to existing models.

**What it means for the user:**
- AUC 0.83 for AD vs CN → decent but not diagnostic. The customer
  should not expect a clinical-grade test from this data alone.
- 3-4.8% reduction in ether lipids → small effect size. Needs
  large N to replicate. Pilot studies under n=100 will not see
  this signal reliably.
- If the paper reports AUC 0.95 → likely overfitted. Check if
  there is external validation. If not, treat with skepticism.

## 8. Replication and validation

**What we find:** whether results were validated in an independent
cohort, which cohort, sample size, concordance.

**What it means for the user:**
- Validated in ASPREE (n=18,000) → high confidence the signal is
  real. Safe to build on.
- No external validation → the finding might be cohort-specific.
  The customer should budget for a validation step.
- Replicated across Metabolon and Biocrates platforms → platform-
  agnostic signal. The customer can use either provider.

## 9. Access and consent scope

**What we find:** data sharing policy, DUA terms, commercial use
clause, re-consent requirements, ethics committee restrictions,
access timeline.

**What it means for the user:**
- "Consent covers academic research only" → commercial customers
  cannot use this cohort without re-consent or ethics amendment.
  This may take 6-12 months and may fail.
- "Data available via portal with DUA" → standard process, 2-4
  months. Budget for this timeline.
- "Available upon reasonable request to the corresponding author"
  → no formal process. Could be fast or slow. Depends on the PI.
- Nothing mentioned → unknown. Must verify before committing.

## 10. Sample depletion risk

**What we find:** total aliquots, previous studies that consumed
samples, ongoing collection, biobank replenishment policy.

**What it means for the user:**
- 4,730 aliquots but 3 previous metabolomics publications →
  samples may be depleted. Check with the biobank before planning.
- UK Biobank with 500K participants and ongoing collection →
  low depletion risk. Safe to plan a large study.
- "Samples are limited and will not be replenished" → first-come
  first-served. Move fast or miss out.

## 11. Negative results

**What we find:** metabolite classes or pathways that showed no
association, failed assays, known limitations.

**What it means for the user:**
- "No significant association for acylcarnitines after FDR
  correction" → do not pursue acylcarnitines as AD biomarkers
  in this cohort. Saves the customer from a dead end.
- "NMR platform does not capture complex lipids" → if the
  customer's hypothesis involves sphingolipids or ceramides,
  this cohort's data will not test it.

## 12. Published analysis code

**What we find:** whether analysis scripts are publicly available,
which language/framework, whether raw data is accessible.

**What it means for the user:**
- Code on GitHub → the customer can reproduce the analysis, verify
  claims, and build on existing pipelines. Saves weeks of work.
- No code → must rebuild from scratch using the Methods section.
- R vs Python → practical consideration for the customer's team.

## 13. Multi-site recruitment (ClinicalTrials)

**What we find:** list of participating facilities, countries,
number of sites.

**What it means for the user:**
- 6 sites across US (Johns Hopkins, MGH, Emory, WashU) → multi-
  center recruitment reduces site-specific bias. More representative
  than single-center studies. Also means protocol is standardized.
- Single site (e.g. "Kuopio University Hospital") → possible
  population bias. Finnish cohort may not generalize to US patients.
- Multiple countries → regulatory complexity for sample access
  but higher population diversity.

## 14. Eligibility criteria (ClinicalTrials)

**What we find:** exact inclusion/exclusion rules verbatim from
the trial registration.

**What it means for the user:**
- "Disease duration <= 2 years" → early-stage patients only. If
  the user needs full disease progression data, this cohort misses
  late-stage.
- "MMSE >= 20" → mild AD only. Severe AD is excluded. The
  metabolomics signal may not reflect advanced disease.
- "Age 55 to 90" → no early-onset AD (<55). If the user targets
  younger patients, this cohort will not help.
- These criteria define the exact population the user's model will
  learn from. Mismatches between eligibility and the user's target
  population mean the model will not transfer.

## 15. Biospecimen retention and types (ClinicalTrials)

**What we find:** retention policy (SAMPLES_WITH_DNA, SAMPLES_WITHOUT_DNA,
NONE), biospecimen description text.

**What it means for the user:**
- SAMPLES_WITH_DNA → genomics is feasible. The user can cross-
  reference metabolomics against genetic variants.
- "plasma, serum, DNA, CSF, iPSC" → full multi-omics potential.
  Metabolomics hits can be validated against proteomics (CSF),
  functional models (iPSC), and genetics.
- "blood sampling" (generic) → unclear what was actually stored.
  May need PI confirmation that plasma aliquots exist.
- NONE or no mention → samples may not be retained. The trial
  collected data but may not have banked biospecimens.

## 16. Clinical endpoints and scales (ClinicalTrials)

**What we find:** primary and secondary outcomes (ALSFRS-R, CDR,
MMSE, ADAS-Cog, amyloid PET, NfL, etc).

**What it means for the user:**
- ALSFRS-R as primary → gold standard ALS functional scale.
  Metabolomics hits can be directly correlated against clinical
  progression. High publication and regulatory value.
- CDR + MMSE → standard AD cognitive endpoints. Metabolomics
  signatures that predict CDR changes are publishable.
- Amyloid PET as secondary → the user can validate metabolomics
  biomarkers against amyloid pathology. Multi-modal validation
  that regulators care about.
- No cognitive or functional outcome → the cohort may have
  samples but no way to link metabolomics to clinical change.
  Limited value for biomarker development.

## 17. Sponsor and funding (ClinicalTrials)

**What we find:** lead sponsor, collaborators, funding agencies.

**What it means for the user:**
- NIH/NINDS/NIA funded → likely well-documented, maintained long-
  term, with data sharing requirements built into the grant.
  Higher chance of access.
- Industry-sponsored (pharma company) → data may be proprietary.
  Access for external researchers could be restricted or require
  partnership agreement.
- ALS Association, Alzheimer's Association as collaborator →
  advocacy group backing signals long-term cohort viability and
  community engagement. Also may have dedicated data access
  programs for researchers.
- University-only sponsor → access depends entirely on the PI's
  willingness. No formal data sharing mandate.

## 18. Study timeline and status (ClinicalTrials)

**What we find:** start date, completion date, recruitment status,
whether the study is still enrolling.

**What it means for the user:**
- Completed 2022, samples retained → fixed sample set. What
  exists is what you get. No new patients.
- Still recruiting → the cohort is growing. The user could time
  their request to coincide with a larger sample set.
- Completed but no publications → samples exist but data may not
  be analyzed yet. The user could propose a collaboration to
  analyze banked samples (attractive to PIs who need publications).

---

## How to use this file

These 18 dimensions are a vocabulary, not a checklist. Do NOT
extract all 18 for every cohort. That produces noise.

The extraction subagent reads the `scope_notes` from request.json
and uses judgment to decide which dimensions matter for THIS
specific request. The scope_notes are the brief.

Examples:

**scope_notes: "User needs large blood cohorts for AD model training.
Prioritise n and longitudinal coverage."**
→ Focus on: real numbers (2), longitudinal structure (3),
  demographics (5), co-modalities (6), effect sizes (7)
→ Skip: sample depletion, published code, sponsor details

**scope_notes: "User wants to source plasma samples for cfDNA.
Commercial procurement implied."**
→ Focus on: sample usability (1), access scope (9), sample
  depletion (10), biospecimen retention (15), study timeline (18)
→ Skip: effect sizes, replication, medication confounders

**scope_notes: "User has a biomarker panel and needs validation
cohorts with matched controls."**
→ Focus on: replication (8), clinical endpoints (16), eligibility
  criteria (14), demographics (5), real numbers (2)
→ Skip: sample usability, published code, provider landscape

The subagent picks 5 to 8 dimensions per cohort based on the
brief. For each picked dimension, it extracts the fact AND the
implication. Dimensions not relevant to the request are omitted
entirely.

## The rule

Never include a dimension without its implication. If you cannot
finish the sentence with "which means for your project..." then
do not include it. Facts without consequences are noise.
Intelligence is facts plus what they mean for the decision.
