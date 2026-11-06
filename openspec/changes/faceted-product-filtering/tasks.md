# Tasks: Faceted Product Filtering (Amazon-style)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,730 total (S1 ~340 / S2 ~480 / S3 ~410 / S4 ~500) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 (split S2/S4 internally if >400) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Attribute registry: model + migrations + seeds + RBAC + cache key | PR 1 | base develop (branch slice-1); Jest + re-run migrations twice |
| 2 | Data campaign: parser + backfill scripts + audit | PR 2 | base slice-1; dry-run over all 1,191; split 2a/2b if >400 |
| 3 | Facets API: filters + counts + schema endpoint + detail | PR 3 | base slice-2; curl facet matrix |
| 4 | Admin UI: CRUD routes + page + ProductForm inputs | PR 4 | base slice-3; permission-matrix 403s |

## Slice 1: Attribute Registry — Model, Migrations, Seeds, RBAC (~340 lines)

- [ ] 1.1 RED: new `src/__tests__/migrations-attributes.test.ts` — runMigrations twice on compose MySQL: `attributes.category_id` present + nullable, `uq_attr_category_code` index exists (information_schema.STATISTICS), no dup codes/permission/seed rows. Verify: fails red. ~+50
- [ ] 1.2 `models/Attribute.ts`: add `category_id?: number`; replace `code` unique index with composite `uq_attr_category_code (category_id, code)`; `component_type` stays allowNull:false. Verify: tsc clean. ~+15
- [ ] 1.3 `models/associations.ts`: `Category.hasMany(Attribute, { foreignKey: 'category_id', as: 'attributes' })` + `Attribute.belongsTo(Category)`. Verify: tsc clean. ~+8
- [ ] 1.4 `scripts/runMigrations.ts`: MIGRATIONS += `{ table: 'attributes', column: 'category_id', definition: 'INT NULL DEFAULT NULL' }`; new UNIQUE_INDEX_MIGRATIONS section (idempotent via information_schema.STATISTICS, mirrors MIGRATIONS check): drop `code` unique, add composite. Verify: re-run no-op; `SHOW INDEX FROM attributes` shows uq_attr_category_code. ~+30
- [ ] 1.5 `scripts/runMigrations.ts`: ATTRIBUTE_SEEDS + ATTRIBUTE_VALUE_SEEDS per D2 table (laptops/proyectores/monitores/impresoras/tarjetas-video/procesadores/tablets) — category id resolved by slug at runtime (no hardcoded ids), INSERT IGNORE on composite key, values case-normalized, `component_type` = category slug, display_order sequence. Verify: 1.1 green; laptop schema shows cpu_family/ram_gb/storage/screen_size/has_gpu/gpu_model/os. ~+100
- [ ] 1.6 `scripts/runMigrations.ts`: REQUIRED_PERMISSIONS += view/create/update/delete-attributes (module catalog, ES names); STORE_OPERATOR_GRANTS += view/create/update (never delete); admin all four via existing grant. Verify: permission rows stable on re-run. ~+17
- [ ] 1.7 `middleware/cache.ts`: `CACHE_KEYS.attributes = 'attributes:*'` + `invalidateAttributesCache()` via deleteCachePattern. Verify: node smoke. ~+8
- [ ] 1.8 GREEN: 1.1 green (migration on live DB + PC-builder unaffected scenarios); `/api/compatibility/attributes/processor` returns same rows. ~0
- [ ] 1.9 Slice verify: `npm --prefix peruana-informatica/backend test` exit 0; startup run twice idempotent (seeds, index, RBAC). ~0

## Slice 2: Attribute Data Campaign — Parser + Backfill Scripts (~480 lines)

- [ ] 2.1 RED: new `src/__tests__/productSpecs.test.ts` — spec scenarios: Victus name → cpu_family=Intel/ram_gb=8/storage=512gb/has_gpu=true/screen_size=15.6; `39.6 cm` → inches converted; `1TB+512GB` → `value_text='1tb,512gb'`; missing GPU token → gap queued for LLM, no fabrication. Verify: fails red. ~+80
- [ ] 2.2 `utils/productSpecs.ts`: add `parseProductAttributes(product, categorySlug) → { drafts, gaps }` — name-first then description fallback per attribute, per-category PARSER_RULES, ES/EN dictionary (I5/I7/I9/R5/R7/RTX/GTX/SSD/HDD/GB/TB/pulg/`"`), unit normalization (cm→inches, GB/TB as declared value codes), select → value_id, number/boolean/text → typed columns, multiselect → value_text comma-joined; `extractComponentSpecs` kept untouched. Verify: 2.1 green; tsc clean. ~+180
- [ ] 2.3 `scripts/backfill-attributes.ts` (pattern recategorize-keywords.ts): parser over ALL 1,191 products (in-stock + out-of-stock); resolve codigo_interno → numeric product_id ONCE up front (abort pre-check on unresolved — junction quirk D8); dry-run default (writes nothing + audit); live = INSERT IGNORE upsert on unique (product_id, attribute_id); never price/stock/name/category_id/images. Verify: DRY_RUN=1 row count unchanged (0 → 0); 60–75% coverage target. ~+120
- [ ] 2.4 `scripts/backfill-attributes-llm.ts` (pattern recategorize-llm.ts): qwen3.5:9b, temperature 0, format json, batches of 25, OLLAMA_URL default http://localhost:11434; per-candidate confidence ≥ ATTRIBUTE_CONFIDENCE (0.85) AND code ∈ category registry AND select/multiselect value ∈ attribute_values (else hallucinated-slug veto logged); ATTRIBUTE_SKIP_FILE (cod_producto → reason, no write); bulkCreate updateOnDuplicate idempotent; extraction only, never category assignment. Verify: DRY_RUN=1 audit; vetoed/skips sane; re-run no dup rows. ~+150
- [ ] 2.5 Audit report: `backups/attributes/attributes-<ts>.json` + overwrite `attributes-latest.json` — assignments (cod_producto, name, method parser|llm, code, value, value_type, confidence), skips+reasons, vetoed, counts, coverage {parsed, llm_filled, none, total: 1191}; USER-VISIBLE summary in PR/report. Verify: JSON schema complete. ~+20
- [ ] 2.6 `backend/package.json` (+.env sample): `backfill:attributes` / `backfill:attributes:llm` / `backfill:attributes:audit` scripts; env ATTRIBUTE_CONFIDENCE=0.85, ATTRIBUTE_SKIP_FILE, DRY_RUN=1, OLLAMA_URL. Verify: `npm run backfill:attributes -- --dry-run` resolves. ~+5
- [ ] 2.7 Run-book discipline (no code): fresh backup `backups/peruana_informatica_<ts>.sql` (refresh 20260919 baseline) → 2.3 dry-run → review gaps + SKIP file → DRY_RUN=1 2.4 → live run; verify laptops ≥95%, zero dup (product_id, attribute_id), price/stock/name unchanged (SQL), coverage over 1,191. Verify: audit JSON + SQL counts. ~0

## Slice 3: Facets API — Filters, Counts, Schema Endpoint (~410 lines)

- [ ] 3.1 RED: route tests (supertest, repo style): `filter[ram_gb]=8` returns only 8GB laptops; unknown `filter[not_a_code]` → identical result set; facets present + counts reflect active brand filter; listing items omit attribute rows; detail keeps specifications + additive productAttributes; schema endpoint 404 on unknown slug. Verify: fails red. ~+130
- [ ] 3.2 `routes/productRoutes.ts` (L78): parse `filter[<code>]` nested params; resolve (category_id, code) with category param else code-only across registry, unknown ignored (zero result impact); AND across attributes / OR within one (select value_id IN, number value_number =, boolean value_boolean =, multiselect FIND_IN_SET(value_code, value_text)); subquery `cod_producto IN (SELECT product_id FROM product_attributes …)` — main findAndCountAll untouched, `is_active=1 AND stock>0` gate + existing filters in force. Verify: 3.1 filter scenarios green. ~+120
- [ ] 3.3 `routes/productRoutes.ts`: additive `facets` object `{ code: [{ value, code, count }] }` per filterable attribute of active category; one bounded grouped query per attribute over the filtered product-id set (≤800 rows), own facet's filter excluded from its count; multiselect counts via FIND_IN_SET aggregation. Verify: 3.1 counts scenarios green + curl facet matrix. ~+80
- [ ] 3.4 `routes/categoryRoutes.ts`: `GET /api/categories/:slug/attributes` → `{ success, data: { category, attributes:[{ code, name, input_type, unit, is_filterable, display_order, values }] } }` ordered by display_order; unknown slug → 404; `cacheSuccessMiddleware('attributes', 60)`. Verify: 3.1 schema scenarios green. ~+60
- [ ] 3.5 `routes/productRoutes.ts`: `GET /:id` + `/slug/:slug` add additive `productAttributes` include (typed values + attribute code/name); `specifications` kept; listing omits both. Verify: detail-intact scenario green. ~+25
- [ ] 3.6 Cache: confirm distinct sorted-query keys per filter combo (distinct-keys scenario); attribute/value writes → invalidateAttributesCache() + invalidateProductsCache() from slice 1. Verify: cache integration scenario green; attribute-write invalidation curl. ~+5

## Slice 4: Admin Attribute UI — CRUD + ProductForm (~500 lines)

- [ ] 4.1 RED: admin route tests (supertest + permission matrix): POST create → 201 + attribute exists; store-operator DELETE → 403 no mutation; value POST/PUT/DELETE guarded; writes invalidate attributes:* + products:*; viewer page shows no edit controls. Verify: fails red. ~+120
- [ ] 4.2 `routes/admin/attributeRoutes.ts` (pattern brandRoutes.ts): 7 guarded routes (GET ?category_id= view / POST create / PUT :id update / DELETE :id delete + cascade values / POST :id/values create / PUT + DELETE attribute-values/:id), each `checkPermission('<verb>-attributes')`; list ordered by display_order incl values; write handlers call both cache invalidations. Verify: 4.1 green. ~+160
- [ ] 4.3 `server.ts`: register admin attribute routes after authenticateToken, before other admin routes (repo ordering rule). Verify: tsc; routes reachable behind auth. ~+5
- [ ] 4.4 `frontend/src/app/admin/attributes/page.tsx`: category selector → attribute list by display_order; in-page [id] edit modal (input_type/is_filterable/unit/values); client-gated by hasPermission('view-attributes'), write controls by create/update (viewer sees none). Verify: 4.1 viewer scenario; page lists per category. ~+160
- [ ] 4.5 `frontend/src/components/admin/products/ProductForm.tsx`: new "Atributos del catálogo" section ABOVE free-text Especificaciones (L740–829 kept for non-registry keys); inputs from `GET /api/admin/attributes?category_id=<selected>` (watch category_id → reload on recategorization); typed controls number/boolean/select/multiselect/text; save payload extends `{ attributes: [{ code, value: string|number|boolean|string[] }] }`. Verify: category-switch shows monitores inputs. ~+120
- [ ] 4.6 `routes/admin/productRoutes.ts` create/update: transactional upsert of product_attributes from `attributes` payload (resolve value_id for selects, comma-join multiselect → value_text, typed columns; bulkCreate updateOnDuplicate — no dup rows); free-text specifications JSON write unchanged; product write already invalidates products:*. Verify: save-to-EAV scenario green. ~+50
- [ ] 4.7 Slice verify: `npm --prefix peruana-informatica/backend test` exit 0; permission-matrix 403s via curl; Playwright snapshot baseline vs post-change = storefront pixel-identical. ~0

## Dependencies

Slice 1 gates 2–4 (registry + RBAC must exist for campaign targets, facet resolution, admin guards). Slice 2 feeds slices 3–4 deploy (facets/admin read real EAV data); 3.x/4.x code may build on slice 1 but should not merge before the campaign. S1 order: 1.1 → 1.2/1.3 → 1.4 → 1.5 → 1.6/1.7 → 1.8/1.9. S2 order: 2.1 → 2.2 → 2.3 → 2.4 → 2.5/2.6 → 2.7 (campaign after all code). S3 order: 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6. S4 order: 4.1 → 4.2/4.3 → 4.4 → 4.5/4.6 → 4.7. Each slice keeps repo green: full suite exit 0 at end of S1, S3, S4; S2 green = tsc build + node smoke + DRY_RUN audits (recategorization script pattern, no suite impact).

## Notes

- **Branch**: `feat/faceted-filtering` from `develop` (D7), independent of the pending `feat/store-operator-write` chain. PR 1 targets develop; PRs 2–4 target the immediate prior slice branch (Feature Branch Chain — retarget/rebase until child diffs show only the current slice).
- **Sequencing vs prior chain**: `feat/store-operator-write` has 3 pending chained PRs on the same repo. This change MUST NOT base on that branch — models/migrations can collide on `runMigrations.ts` (both touch it). Apply of slices 1–2 does NOT need to wait for the prior chain's PR creation; only MERGE ORDER needs care: land store-operator PRs first (or run both review orbits in parallel with explicit reviewer capacity) so develop diffs stay disentangled. If the store-operator chain is mid-flight when slice 1 lands, expect a small `runMigrations.ts` merge conflict on the seeds/permissions sections — resolve by keeping both changes additive.
- **Budget check vs design**: design estimated 380/420/380/420 (~1,600). Real forecast on file/concern count: 340/480/410/500 (~1,730) — S2 and S4 individually drift over 400; if a slice crosses ~400 during apply, split internally (2a parser+tests / 2b scripts; 4a API+page / 4b ProductForm+write) using prior-change 2a/2b precedent.
- **UNIQUE_INDEX_MIGRATIONS precedent**: no existing repo precedent (design D1) — validate `information_schema.STATISTICS` against live DB before first deploy; task 1.4's test doubles as the precedent proof.