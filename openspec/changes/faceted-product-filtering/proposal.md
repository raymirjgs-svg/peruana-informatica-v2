# Proposal: Faceted Product Filtering (Amazon-style)

## Intent

Make the store catalog filterable by real technical specs — RAM, storage, screen size, CPU family, GPU, lumens, resolution, etc. — so customers narrow products by actual data, not just price/brand. Activates the existing-but-dead EAV attribute stack (Attribute/AttributeValue/ProductAttribute) with per-category attribute definitions, a measured name-parser + LLM backfill across all 1,191 products, public facet-aware APIs, and admin attribute CRUD guarded by new RBAC keys. Data work, not UI work.

## Question Round (User Decisions)

1. Facets for ALL parseable categories — laptops/projectors were examples only.
2. LLM assist (qwen3.5:9b, 0.85 confidence, SKIP list, audit; dry-run→review→live) fills parser gaps.
3. ZERO storefront visual changes — data only, no redesign.
4. Admin attribute CRUD in scope; new RBAC keys view/create/update/delete-attributes (module catalog).
5. Spec-shaped subcategories created where meaningful (e.g. Ultrabook/Gamer/Empresarial under laptops).
6. Backfill measured against ALL 1,191 products (not just in-stock).
7. Activate dead EAV stack — don't rebuild.

## Scope

### In Scope
- Attribute registry bound to categories (Attribute.category_id) + TABLE_MIGRATIONS bootstrap + per-category definition seeds.
- Subcategory seeds where data shapes them; existing product_sub_categories junction mechanics reused.
- Name-first per-category parser + LLM pass backfilling ProductAttribute rows (upsert; unique product+attribute).
- Public `/api/products` facet filters + counts; new `/api/categories/:slug/attributes` schema endpoint.
- Admin CRUD for attributes/values; ProductForm per-category attribute inputs.
- RBAC keys seeded via runMigrations.

### Out of Scope (Non-goals)
- No storefront visual changes: no sidebar rewrite, no grid/card changes, no filter-UX work this change.
- No new attribute tables, JSON-column substitute, or typed columns — EAV activated as-is.
- 12 still-uncategorized products (prior change) handled separately/flagged, not blocked.
- No legacy `category` STRING reintroduction; PC Builder cotizador untouched.

## Capabilities

### New Capabilities
- `product-faceted-filtering`: per-category attribute registry, EAV backfill, public facet API, admin CRUD + RBAC.

### Modified Capabilities
- None (catalog-recategorization is a completed change; its requirements don't change).

## Approach

1. Models/migrations/RBAC: Attribute.category_id + joins; TABLE_MIGRATIONS entry; seed definitions; permission keys.
2. Parser rebuild (name-first, per-category) → dry-run on all 1,191 → review → live (recategorization discipline; fresh pre-campaign backup).
3. LLM pass on residuals; audit; subcategory seeds.
4. Public API: attribute filter params, facet counts, category schema endpoint; Redis keys auto-distinct.
5. Admin attribute CRUD + ProductForm inputs; invalidate `attributes:*` cache.

## Affected Areas

| Area | Impact |
|------|--------|
| `backend/src/models/Attribute.ts` (+associations) | Modified — category binding |
| `backend/src/scripts/runMigrations.ts` | Modified — tables, seeds, RBAC |
| `backend/src/utils/productSpecs.ts` | Modified — name-first parser |
| `backend/src/routes/productRoutes.ts` | Modified — facet filters/counts |
| `backend/src/routes/admin/*` (attributes) | New — CRUD |
| `frontend/src/app/admin/*/ProductForm` | Modified — attribute inputs |
| scripts/ backfill + backups/ | New — campaign + pre-backup |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Parser data quality (inconsistent names) | Med | name-first, per-category, tested on all products |
| LLM hallucination on attributes | Med | 0.85 threshold + SKIP + audit |
| Listing payload growth | Med | heavy data stays detail-only |
| Entrenching `/api/laptops` subcat workaround | Low | don't extend; facets supersede |
| 400-line review budget overflow | High | chained PRs (models/API / data / frontend / admin) |

## Rollback Plan

Restore pre-campaign backup (backups/peruana_informatica_20260919_222455.sql + fresh one taken before live run); git-revert code PRs; redeploy compose. Backfill upserts are idempotent.

## Dependencies

- Compose stack; qwen3.5:9b on Ollama; Redis cache.
- Agent impact: store-operator gains attribute write via admin API + new RBAC keys; qa-agent unaffected.
- Size: >400 changed lines → chained PRs expected (per-slice targets from exploration).

## Success Criteria

- [ ] 60-75% of catalog parseable; laptops ≥95% with LLM pass; audit report produced.
- [ ] Facet filters + counts verified on `/api/products` per category.
- [ ] Admin attribute CRUD green under new RBAC keys; permission matrix tested.
- [ ] EAV tables populated (were 0 rows); no duplicate (product, attribute).
- [ ] Storefront pixel-identical; full Jest suite green.