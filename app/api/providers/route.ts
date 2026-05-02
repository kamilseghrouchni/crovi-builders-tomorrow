import { NextRequest, NextResponse } from "next/server";
import { findAssayInCatalog, listAllAssays, providersForAssay } from "@/lib/catalogs";
import type { AssayChoice, ProvidersApiResponse } from "@/lib/bundle";

/**
 * GET /api/providers?assays=DNA%20methylation,Bulk%20RNA-seq
 *
 * If `assays` is empty or omitted, returns the full catalog of assays
 * (no candidates) so the UI can present a picker.
 */
export async function GET(req: NextRequest): Promise<NextResponse<ProvidersApiResponse>> {
  const { searchParams } = new URL(req.url);
  const assaysParam = searchParams.get("assays")?.trim();

  if (!assaysParam) {
    const catalog = listAllAssays();
    return NextResponse.json({
      assays: catalog.map((a) => ({
        assay: a.specific_assay,
        family: a.assay_family,
        candidates: [],
      })),
    });
  }

  const queries = assaysParam.split(",").map((s) => s.trim()).filter(Boolean);
  const out: AssayChoice[] = [];
  for (const q of queries) {
    const catalogHit = findAssayInCatalog(q);
    out.push({
      assay: catalogHit?.specific_assay ?? q,
      family: catalogHit?.assay_family ?? "Unknown",
      candidates: providersForAssay(catalogHit?.specific_assay ?? q),
    });
  }

  return NextResponse.json({ assays: out });
}
