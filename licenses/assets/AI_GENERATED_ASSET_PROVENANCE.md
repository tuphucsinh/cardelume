# Reusable AI-Generated Production Asset Provenance

AI-generated artwork is not automatically production-safe. Any reusable/generated production asset must have an entry in `ASSET_PROVENANCE_MANIFEST.json` and, when `sourceType` is `ai-generated`, record at minimum:

- provider and model/version when exposed;
- generation/acquisition date;
- content SHA-256 of the exact shipped binary;
- prompt/reference **hash or privacy-safe abstract description**, not customer private content;
- source/reference asset IDs and their approved provenance, if any;
- provider commercial-use/redistribution terms evidence applicable at generation time;
- human reviewer, review date and originality/reference-similarity review;
- commercial/derivative/redistribution/attribution findings;
- final `APPROVED`, `APPROVED_WITH_ATTRIBUTION`, `REJECTED` or `UNKNOWN` state.

`UNKNOWN` cannot publish. Do not persist a customer's private prompt/photo merely to satisfy provenance; use content-free hashes/asset IDs and separately governed evidence.
