# Design: Faceted Product Filtering (Amazon-style)

## Technical Approach

Activate the dead EAV stack (Attribute/AttributeValue/ProductAttribute — schema + associations + unique `(product_id, attribute_id)` already exist, zero rows) by: (1) binding attributes to categories via a nullable `category_id` FK with a composite-unique `(category_id, code)` key, seeded per-category definitions through `runMigrations.ts` plus four new RBAC keys; (2) rebuilding the parser name-first per-category with unit normalization, then an LLM assist pass (qwen3.5:9b) for residuals under the recategorization discipline (backup → dry-run → review → live, idempotent upserts); (3) exposing facets on `GET /api/products` (filter params + counts) and a new `GET /api/categories/:slug/attributes` schema endpoint, both through the existing sorted-query Redis cache; (4) admin attribute/value CRUD guarded by `*-attributes` permissions + ProductForm per-category inputs that upsert `product_attributes`. Zero storefront visual change; PC Builder compatibility consumers keep working untouched. Maps to proposal 1–7 and specs: attribute-registry, attribute-data-campaign, facets-api, admin-attribute-ui. Independent branch `feat/faceted-filtering` — does NOT build on `feat/store-operator-write` (see D7).

## Architecture Decisions

### D1: Attribute registry — `category_id` FK + composite-unique `(category_id, code)`; `component_type` kept NOT NULL

| Option | Tradeoff | Decision |
|---|---|---|
| `category_id INT NULL` on `attributes` (additive column migration) | Spec-locked single FK; nullable keeps PC-builder rows and existing rows valid; `Category.hasMany(Attribute)` + `Attribute.belongsTo(Category)` added to `associations.ts` | **Chosen** |
| `category_attributes` M2M junction | More flexible (shared attrs across categories) but spec fixes single FK | Rejected |
| Keep global-unique `code` | `screen_size`/`os`/`storage` recur across laptops·monitores·tablets — forced duplicate codes or prefixed codes (`laptop_screen_size`) → polluted facet param surface | Rejected |

Mechanics (`runMigrations.ts`):
- `MIGRATIONS` += `{ table: 'attributes', column: 'category_id', definition: 'INT NULL DEFAULT NULL' }` (idempotent information_schema check; existing pattern). No FK constraint added in DDL (repo avoids FK-on-live-alter risk; referential integrity enforced at model/seed level).
- New `UNIQUE_INDEX_MIGRATIONS` section (same idempotent pattern via `information_schema.STATISTICS`): drop unique `code` index, add `UNIQUE KEY uq_attr_category_code (category_id, code)`. MySQL treats NULL category_id as distinct → PC-builder rows (category_id NULL) keep single-row codes by convention (verified: current data unique); catalog rows enforce per-category uniqueness. Model `indexes` updated to match.
- `Attribute.ts`: add `category_id?: number`, `component_type` stays `allowNull:false`; catalog-bound seeds set `component_type = <category slug>` (deterministic, no collision with PC-builder values processor/motherboard/ram/storage/gpu/case/psu/cooler — `getAttributesByComponentType` filters exact `component_type`, so compat path returns identical rows).
- `associations.ts`: `Category.hasMany(Attribute, { foreignKey: 'category_id', as: 'attributes' })` + `Attribute.belongsTo(Category, ...)`. PC Builder consumers (compatibilityRoutes, CompatibilityService, CompatibilityRule, cotizador) untouched — verified no dependency on `code` uniqueness semantics change beyond rows they already read.

**Cache**: add `CACHE_KEYS.attributes = 'attributes:*'` + `invalidateAttributesCache()` (`deleteCachePattern('attributes:*')`) in `middleware/cache.ts`.

**RBAC** (`runMigrations.ts`): `REQUIRED_PERMISSIONS` += `view-attributes`, `create-attributes`, `update-attributes`, `delete-attributes` (module `catalog`, names 'Ver Atributos'/'Crear Atributos'/'Editar Atributos'/'Eliminar Atributos'). `READONLY_PERMISSION_SLUGS` auto-covers view-attributes (viewer). `STORE_OPERATOR_GRANTS` += `view-attributes, create-attributes, update-attributes` (never delete). Admin additive all four via existing `grantPermissions(admin, ALL)`. `INSERT IGNORE` → idempotent.

### D2: Seed set — per-category definitions, data-seeded idempotently by `(category_id, code)`

Resolved **by category slug at runtime** (`SELECT id FROM categories WHERE slug=:slug` — no hardcoded ids, prior-change discipline). New `ATTRIBUTE_SEEDS` / `ATTRIBUTE_VALUE_SEEDS` arrays processed in `runMigrations.ts` after table bootstrap, `INSERT IGNORE` on the composite unique key; re-run is a no-op. `component_type` = category slug; `is_required` false; `display_order` sequence; values carry case-normalized `code` + display `value` (`attribute_values` unique-per-attribute by `code`).

| Category (slug) | attribute (code) | input_type | unit | is_filterable | seeded values |
|---|---|---|---|---|---|
| laptops | cpu_family | select | — | ✓ | intel, amd |
| laptops | ram_gb | number | GB | ✓ | — |
| laptops | storage | multiselect | GB | ✓ | 256gb, 512gb, 1tb, 2tb |
| laptops | storage_type | select | — | ✓ | ssd, hdd, nvme (additive, names always carry it) |
| laptops | screen_size | number | inches | ✓ | — |
| laptops | has_gpu | boolean | — | ✓ | — |
| laptops | gpu_model | text | — | ✓ (values grow via admin) | — |
| laptops | os | select | — | ✓ | windows, chromeos, linux, dos, sin-sistema |
| proyectores | lumens | number | lm | ✓ | — |
| proyectores | resolution | select | — | ✓ | xga, wxga, hd-720p, fhd-1080p, wuxga, 4k-uhd |
| proyectores | lamp_life | number | h | ✓ | — |
| proyectores | connectivity | multiselect | — | ✓ | hdmi, vga, usb, wifi, bluetooth, rca |
| monitores | screen_size | number | inches | ✓ | *(reuses code — composite key)* |
| monitores | hz | number | Hz | ✓ | — |
| monitores | panel_type | select | — | ✓ | ips, va, tn, oled |
| monitores | curved | boolean | — | ✓ | — |
| impresoras | tech | select | — | ✓ | inyeccion, laser, ecotank, termica, sublimacion |
| impresoras | multifuncion | boolean | — | ✓ | — |
| impresoras | wifi | boolean | — | ✓ | — |
| impresoras | ink_count | number | ml | ✓ | — |
| impresoras | connectivity | multiselect | — | ✓ | usb, wifi, ethernet, bluetooth |
| tarjetas-video | vram | number | GB | ✓ | — |
| tarjetas-video | model | text | — | ✓ | — |
| tarjetas-video | chipset | select | — | ✓ | nvidia, amd, intel |
| procesadores | family | select | — | ✓ | intel-core, amd-ryzen, intel-xeon, amd-athlon |
| procesadores | socket | select | — | ✓ | lga1700, lga1200, am4, am5 |
| procesadores | cores | number | — | ✓ | — |
| procesadores | tdp | number | W | ✓ | — |
| tablets | screen_size | number | inches | ✓ | *(shared code)* |
| tablets | os | select | — | ✓ | android, ios, windows |
| tablets | storage | multiselect | GB | ✓ | *(shared code)* |

Categories with no parseable data: zero attributes (spec acceptance). 12 uncategorized products: no seed impact (see D8).

### D3: Parser table — name-first per-category rules; multiselect stored as value_text codes

Rebuild `utils/productSpecs.ts`: keep `extractComponentSpecs` for existing consumers (CotizadorController/LaptopController) unchanged; add `parseProductAttributes(product, categorySlug) → { drafts: AttributeDraft[], gaps: string[] }` driving the new registry only.
- Order: parse `product.name` FIRST; fall back to `description` per-attribute (no invented values — a missing GPU token queues the LLM pass, never fabricates).
- Per-category regex tables (`PARSER_RULES[categorySlug]`): each rule keys `{code, pattern(s), kind: number|boolean|select|multiselect|text, unit?, normalize?}`.
- ES/EN abbreviation dictionary: `LAPTOP|LAPTO`, `PROCE`, `TARJ`, `I5-|I7-|I9-|CORE I3` → cpu_family intel; `R5|R7|R9|RYZEN` → amd; `RTX|GTX` → has_gpu true; `HDD|SSD|NVMe`; `"`/`''` and `pulg` → inches; `GB|TB|ML|HZ|LM|W`.
- Unit normalization: `cm → inches` (`/2.54`, round 1dp); `GB/TB` kept in declared form as value codes (512gb, 1tb); `1TB+512GB` multi-value → multiselect `value_text = "1tb,512gb"` (see D5 for storage contract — single `value_id` cannot hold two values under the spec-locked unique `(product_id, attribute_id)` index; a "combined value" row was permitted by spec, but comma-joined codes preserve filterability per component, which combined values cannot).
- Parseability target (exploration §7, measured over ALL 1,191): 60–75% catalog parseable by rules; laptops ~85–90% name+description, ≥95% with LLM pass. `gaps` per product → residual queue.

**Multiselect storage contract** (locked by spec's unique index): select → `value_id`; number → `value_number`; boolean → `value_boolean`; text → `value_text`; **multiselect → `value_text` = comma-joined value codes** (`'1tb,512gb'`). New parser/LLM/admin all write this shape; filter/count semantics in D5 read it.

### D4: LLM contract — extraction only, never assignment; veto + idempotent upsert

`backend/src/scripts/backfill-attributes-llm.ts` (mirrors `recategorize-llm.ts` mechanics: dev-host runner, `OLLAMA_URL` default `http://localhost:11434`, batches of 25, `format: 'json'`):
- Prompt: system = "Eres un extractor de atributos técnicos. NO asignas categorías. Devuelve SOLO JSON." + registry JSON for the product's category (codes, input_type, unit, allowed value codes); user = product name + description. **Never** category assignment (that was the prior change; mixing would drift).
- `qwen3.5:9b`, `temperature: 0`, `format: 'json'`.
- Per candidate: `confidence ≥ ATTRIBUTE_CONFIDENCE` (env, default 0.85) AND code ∈ registry-of-category (else **hallucinated-slug veto**, logged — learned from `micropornos` on the category pass) AND select/multiselect value ∈ `attribute_values` (else veto). SKIP list: `ATTRIBUTE_SKIP_FILE` JSON `{cod_producto: reason}` — no write, audited.
- Upsert: Sequelize `bulkCreate` with `updateOnDuplicate` on unique `(product_id, attribute_id)`; re-runs idempotent, no dup rows.
- Pre-check (junction quirk, D8): every target resolves `codigo_interno → numeric product_id`; unresolved rows abort the live run before any write (spec scenario).
- `DRY_RUN=1` default env: writes nothing, produces full audit. Live only after dry-run review + fresh backup (`backups/peruana_informatica_<ts>.sql`, refreshing the `20260919_222455` baseline).
- Audit: `backups/attributes/attributes-<ts>.json` + overwrite `attributes-latest.json` — `{assignments:[{cod_producto, name, method: parser|llm, code, value, value_type, confidence}], skips:[{cod_producto, reason}], vetoed:[{cod_producto, code, reason}], counts, coverage:{parsed, llm_filled, none, total:1191}}`.
- Never touches price/stock/name/category_id/images (spec acceptance).
- `backend/package.json` scripts: `backfill:attributes` (parser dry-run/live), `backfill:attributes:llm` (dry-run default), `backfill:attributes:audit` (report).

### D5: Facets API — filter contract, counts, schema endpoint, cache

**Filter contract** on existing `GET /api/products` (route `productRoutes.ts` L78): `filter[<code>]=<value>` — comma-separated for multiselect; repeatable (`filter[storage]=1tb&filter[storage]=2tb`). Express parses nested keys into `req.query.filter`; validation accepts any `filter` object keys + existing query validators unchanged; **unknown codes ignored** (spec — resolve then drop, zero result impact).
- Resolution: `(category_id, code)` when `category` param present; without `category`, resolve by `code` across registry and apply the match (any product holding that attribute); no match → ignored.
- Semantics: AND across attributes, OR within one attribute's values (multiselect via `FIND_IN_SET(code, value_text)`; select via `value_id IN (resolved ids)`; number via `value_number = :n`; boolean via `value_boolean = :b`). Implemented as `where.cod_producto IN (SELECT product_id FROM product_attributes WHERE ...)` subquery — joins stay off the main `findAndCountAll`, `is_active=1 AND stock>0` gate and all existing filters remain in force.
- **Counts**: response gains additive `facets` object `{code: [{value, code, count}]}` for each filterable attribute of the active category. Computed on the current filtered product-id set (brand/price/search/other-facet filters applied; the facet's OWN filter excluded — spec: "counts reflect the filtered result set"). One grouped query per attribute over the category's post-gate product set (≤ ~800 rows → bounded; ~8 attributes/category worst case). Multiselect counts via `FIND_IN_SET` aggregation over the same id set. Listing items carry NO attribute payload (spec).
- **Schema endpoint**: `GET /api/categories/:slug/attributes` (public `categoryRoutes.ts`) → `{success, data:{category, attributes:[{code,name,input_type,unit,is_filterable,display_order,values:[{value,code}]}]}}` ordered by `display_order`; unknown slug → HTTP 404. Flows through `cacheSuccessMiddleware('attributes', 60)`.
- **Detail only**: `GET /:id` and `/slug/:slug` keep `specifications` and add additive `productAttributes` include (typed values + attribute code/name). Listing omits both.
- **Cache**: existing `generateCacheKey` sorts query keys → distinct filter combos produce distinct keys (verified). TTL 60s on listings. Invalidation: attribute/value CRUD → `invalidateAttributesCache()` + `invalidateProductsCache()` (covers facets embedded in listings); product writes already invalidate `products:*`.

### D6: Admin UI — CRUD routes guarded by `*-attributes`; ProductForm per-category inputs

Backend (`routes/admin/attributeRoutes.ts`, registered `app.use('/api/admin/attributes', ...)` in `server.ts` after `authenticateToken` — pattern of `admin/brandRoutes.ts`; each route `checkPermission('<verb>-attributes')`):

| Route | Method | Permission | Notes |
|---|---|---|---|
| `/api/admin/attributes?category_id=` | GET | view-attributes | ordered by display_order, include values |
| `/api/admin/attributes` | POST | create-attributes | 201; invalidate both caches |
| `/api/admin/attributes/:id` | PUT | update-attributes | invalidate both |
| `/api/admin/attributes/:id` | DELETE | delete-attributes | 403 for store-operator; cascade values via model; invalidate both |
| `/api/admin/attributes/:id/values` | POST | create-attributes | value+code upsert |
| `/api/admin/attribute-values/:id` | PUT | update-attributes | invalidate both |
| `/api/admin/attribute-values/:id` | DELETE | delete-attributes | invalidate both |

Frontend:
- New `app/admin/attributes/page.tsx` (+ `[id]` edit modal in-page): category selector → attribute list (display_order), edit input_type/is_filterable/unit + values; gated client-side by `hasPermission('view-attributes')` and write buttons by create/update (viewer sees no edit controls — spec).
- **ProductForm.tsx**: new "Atributos del catálogo" section ABOVE the free-text Especificaciones block (L740–829 kept intact for non-registry keys — spec allows remainder). Inputs rendered from `GET /api/admin/attributes?category_id=<selected>` (watch `category_id` → reload on recategorization; specs scenario). Typed: number/boolean/select/multiselect/text. Save payload extends `{ attributes: [{code, value: string|number|boolean|string[]}] }`.
- Admin product write (`admin/productRoutes.ts` create/update handlers): transactional upsert of `product_attributes` from `attributes` payload (resolve value_id for selects, comma-join multiselect into value_text, typed columns otherwise; `bulkCreate updateOnDuplicate` — no dup rows). Free-text `specifications` JSON write stays as-is.

### D7: Chained-PR slicing — own branch `feat/faceted-filtering`, independent of `feat/store-operator-write`

The repo is mid-chain on `feat/store-operator-write` (3 pending chained PRs, HEAD confirmed). This change branches `feat/faceted-filtering` **from `develop`** — the two chains do NOT merge into each other; **sequencing risk**: two feature chains in one repo → concurrent review orbits + merge-order entanglement with `develop`. Mitigation: market slices PR #1 → `develop` (not the other chain); child PRs target the immediate prior slice branch (Feature Branch Chain rule — retarget/rebase until child diffs are clean); land/store-operator chain first or in parallel only with explicit reviewer capacity.

| Slice | Branch base | Content | Est. lines | Verify |
|---|---|---|---|---|
| 1 | develop | D1 (model+migrations+associations+RBAC+cache key) + D2 seeds + seed/migration idempotency tests | ~380 | Jest + re-run migrations twice |
| 2 | slice-1 | D3 parser rebuild + D4 scripts (dry-run/audit/LLM) + parser unit tests (spec scenarios) | ~420 | Jest + dry-run audit on 1,191 |
| 3 | slice-2 | D5 public API (filters, counts, schema endpoint, cache, detail include) + API tests | ~380 | Jest + curl facet matrix |
| 4 | slice-3 | D6 admin CRUD + admin page + ProductForm inputs + product-write upsert + tests | ~420 | Jest + permission matrix 403s |

Budget forecast: **High** (>400 total, each slice near-budget). Guard lines for sdd-tasks: `Decision needed before apply: Yes` (chain strategy), `Chained PRs recommended: Yes`, `400-line budget risk: High`.

### D8: Data reality guardrails

- **12 uncategorized products**: not blocking (proposal). They get no category-bound schema; campaign includes them in audit as `skipped: no category`; facets for their future categories stay sparse until recategorized.
- **Junction quirk**: `product_sub_categories` keys on `codigo_interno`; `product_attributes` keys on **numeric** `product_id`. NEVER mix — the campaign resolves `codigo_interno → product_id` once up front (pre-check aborts on unresolved; spec scenario), and every parser/LLM/admin write uses the numeric id. Facet joins never touch the subcategory junction.
- **Legacy `category` STRING**: untouched (`suggestions` route still reads it; no reintroduction).
- **`component_specs` retirement: deferred — out of scope for this change.** It feeds the PC-builder/cotizador path (productSpecs consumers); the change is additive-only discipline (spec acceptance: nothing deleted/renamed). A future change may retire it once `product_attributes` + detail rendering cover the same data. `product.specifications` JSON also stays (detail rendering contract; EAV is additive, not a replacement).
- **`/api/laptops` subcat workaround**: not extended; facets supersede it — no code touched there this change.
- **Payload**: listing omits heavy attribute rows (kept detail-only); `facets` additive so no consumed field changes (spec).

## Data Flow

### (a) Seeding & RBAC (startup)

```
server.ts → runMigrations(sequelize, db)
  └─ TABLE_MIGRATIONS (EAV tables IF NOT EXISTS) → UNIQUE_INDEX_MIGRATIONS (category_id+code)
  └─ MIGRATIONS (attributes.category_id INT NULL)
  └─ ensureRolesAndPermissions (4 new keys; viewer/store-operator/admin grants)
  └─ ATTRIBUTE_SEEDS + ATTRIBUTE_VALUE_SEEDS (slug→id at runtime, INSERT IGNORE)
```

### (b) Backfill campaign (dev host)

```
fresh mysqldump backup ─▶ backfill:attributes (parser, name-first per category)
   ─▶ audit JSON ─▶ residual list (gaps/low-confidence) + SKIP file ─▶ review ─▶ DRY_RUN=1
   ─▶ backfill:attributes:llm (qwen3.5:9b, t=0, json, 0.85, veto, batch 25)
   ─▶ codigo_interno→id pre-check (abort if unresolved) ─▶ idempotent upsert product_attributes
   ─▶ backups/attributes/attributes-<ts>.json (+latest) ─▶ coverage over 1,191
```

### (c) Public facets

```
GET /api/products?category=laptops&filter[ram_gb]=8&filter[storage]=512gb
  ─▶ cacheSuccessMiddleware('products',60) [sorted-query key]
  ─▶ resolve (category_id,code) → subquery product_id IN (product_attributes …) → findAndCountAll
  ─▶ facets counts (GROUP BY on filtered id set; FIND_IN_SET for multiselect)
  ─▶ {products, total, facets:{ram_gb:[{value:8,count:…}], …}}
GET /api/categories/laptops/attributes ─▶ cacheSuccessMiddleware('attributes',60) ─▶ schema by display_order
attribute CRUD ─▶ invalidateAttributesCache() + invalidateProductsCache() ─▶ caches expire next request
```

## File Changes

| File | Action | Description |
|---|---|---|
| `backend/src/models/Attribute.ts` | Modify | `category_id`; index `uq_attr_category_code` replace `code` unique |
| `backend/src/models/associations.ts` | Modify | Category↔Attribute association |
| `backend/src/scripts/runMigrations.ts` | Modify | MIGRATIONS entry; UNIQUE_INDEX_MIGRATIONS; ATTRIBUTE_SEEDS/VALUE_SEEDS; 4 permission keys; STORE_OPERATOR_GRANTS += view/create/update-attributes |
| `backend/src/middleware/cache.ts` | Modify | `CACHE_KEYS.attributes`, `invalidateAttributesCache()` |
| `backend/src/utils/productSpecs.ts` | Modify | `parseProductAttributes` (name-first, per-category, dictionary, normalization); keep `extractComponentSpecs` |
| `backend/src/scripts/backfill-attributes.ts` | Create | Parser run, dry-run/live, audit, pre-check |
| `backend/src/scripts/backfill-attributes-llm.ts` | Create | Ollama pass, threshold/SKIP/veto, upsert, audit |
| `backend/src/routes/productRoutes.ts` | Modify | `filter[*]` params, facets counts, detail include `productAttributes` |
| `backend/src/routes/categoryRoutes.ts` | Modify | `GET /:slug/attributes` schema endpoint |
| `backend/src/routes/admin/attributeRoutes.ts` | Create | Attribute + value CRUD (7 routes, guarded) |
| `backend/src/server.ts` | Modify | Register admin attribute routes |
| `backend/src/__tests__/…` | Create/Modify | Parser, migrations idempotency, filters, counts, RBAC 403, cache invalidation |
| `backend/package.json` | Modify | `backfill:attributes*` scripts |
| `frontend/src/app/admin/attributes/page.tsx` | Create | Per-category attribute + value management |
| `frontend/src/components/admin/products/ProductForm.tsx` | Modify | Per-category attribute inputs (above free-text) |
| `frontend/src/app/admin/products/new/page.tsx`, `[id]/edit/page.tsx` | Modify | Extend payload with `attributes` |
| `backups/attributes/` | Create | Campaign audits |
| `backups/peruana_informatica_<ts>.sql` | Create | Fresh pre-live backup |

## Interfaces / Contracts

```ts
// Public
GET /api/products?category=laptops&filter[ram_gb]=8&filter[storage]=1tb,512gb&brand=hp
  → { products:[…unchanged…], total, page, totalPages,
      facets: { ram_gb: [{ value: 8, count: 12 }],
                storage: [{ value: '1tb', count: 9 }, { value: '512gb', count: 18 }] } }

GET /api/categories/:slug/attributes → { success, data:
  { category: { slug, name }, attributes: [{ code, name, input_type, unit, is_filterable,
      display_order, values: [{ value, code }] }] } }

// Admin (all after authenticateToken; per-route checkPermission)
GET    /api/admin/attributes?category_id=1            view-attributes
POST   /api/admin/attributes                          create-attributes
PUT    /api/admin/attributes/:id                      update-attributes
DELETE /api/admin/attributes/:id                      delete-attributes
POST   /api/admin/attributes/:id/values               create-attributes
PUT    /api/admin/attribute-values/:id                update-attributes
DELETE /api/admin/attribute-values/:id                delete-attributes

// ProductForm save payload addition
attributes?: Array<{ code: string; value: string | number | boolean | string[] }>

// Env additions
ATTRIBUTE_CONFIDENCE=0.85   ATTRIBUTE_SKIP_FILE=<json path>   DRY_RUN=1   OLLAMA_URL=http://localhost:11434
```

LLM per-product response (strict JSON): `{ "attributes": [{ "code": "ram_gb", "value": "8", "value_type": "number", "confidence": 0.92 }], "reason": "…" }` — codes validated against the category registry; select/multiselect values validated against `attribute_values`.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Parser (spec scenarios: Victus name → typed values; cm→inches; `1TB+512GB` → `'1tb,512gb'`; missing GPU token → queued, no fabrication) | New `productSpecs.test.ts`, corpus from real names + all-1,191 dry-run coverage report |
| Unit | Migrations idempotency: run twice → no dup codes/permissions, index present | Migration test against compose MySQL (prior-change pattern) |
| Unit | Filter resolution: unknown code ignored; AND across/OR within; multiselect FIND_IN_SET | New route/unit tests |
| Integration | Facets counts reflect active brand filter; schema endpoint 404 on unknown slug; detail keeps specifications + additive productAttributes, listing omits | Supertest against test app (repo test style) |
| Integration | RBAC: store-operator DELETE attribute → 403, no mutation; admin 201/200 | Authenticated curl/supertest per permission matrix |
| Integration | Cache: distinct keys for different filter sets; attribute write invalidates `attributes:*` and `products:*` | Redis-backed integration |
| E2E | Storefront pixel-identical after deploy (no visual change) | Playwright snapshot baseline vs post-change |

Verify command: `npm --prefix peruana-informatica/backend test` (full suite, exit 0).

## Migration / Rollout

1. Deploy slices 1→4 in chain order (`feat/faceted-filtering`), each PR verified independently before the next is based.
2. Slice 1 deploy = startup migrations (column + index + seeds + RBAC) — verify `/api/compatibility/attributes/processor` unchanged and `category_id`/seeds present; re-run startup once to prove idempotency.
3. **Campaign sequence** (dev host, mirrors prior-change discipline):
   1. Confirm fresh backup `backups/peruana_informatica_<ts>.sql`; `SELECT COUNT(*) FROM product_attributes` baseline (0).
   2. `backfill:attributes` → audit; verify 60–75% target, gaps list.
   3. Review residual list + `ATTRIBUTE_SKIP_FILE`.
   4. `DRY_RUN=1 backfill:attributes:llm` → audit only; verify vetoed/skips sane.
   5. Live run; verify laptops ≥95%, no dup `(product_id, attribute_id)`, coverage over all 1,191.
4. Slices 3–4 deploy after campaign so facets/admin read real data.
5. No feature flags; additive-only.

## Rollback

- DB: `mysql … < backups/peruana_informatica_<ts>.sql` (all campaign writes idempotent; restore reverts). Attribute seeds/keys are additive — revert code PRs if schema rollback needed.
- Code: git revert slice branches in chain order; `npm run build` backend; `docker compose -f docker-compose.local.yml up -d`.
- Cache: attribute invalidation is additive; on revert, stale `attributes:*` keys expire by TTL (60s) — no manual flush needed.
- PC Builder/cotizador: untouched by design; verify `/api/compatibility/attributes/processor` pre/post as smoke test.

## Open Questions / Risks

- [x] Multiselect under unique `(product_id, attribute_id)` — **resolved**: `value_text` comma-joined codes; counts via `FIND_IN_SET` (spec permits combined representation; keeps the spec-locked unique index).
- [x] `filter[]` without `category` — **resolved**: resolve by `code` across registry; unknown/ambiguous ignored (spec-mandated ignore).
- [x] Shared codes across categories — **resolved**: composite unique `(category_id, code)`; MySQL NULL-distinct semantics on PC-builder rows documented (existing data unique).
- [ ] Two feature chains (`feat/store-operator-write` + `feat/faceted-filtering`) in one repo — merge-order entanglement with `develop`; chain PR #1 targets `develop`, reviewer capacity must cover both orbits.
- [ ] Ollama extraction quality on qwen3.5:9b — 0.85 threshold + SKIP + hallucinated-slug veto + audit + human review (proven discipline from recategorization).
- [ ] `UNIQUE_INDEX_MIGRATIONS` has no existing repo precedent — DDL mirrors MIGRATIONS idempotency check; validate `information_schema.STATISTICS` on live DB before first deploy.
- [ ] Budget: `Delivery strategy ask-on-risk (C1)` — forecast **High** >400 → chained PRs recommended (4 slices) — `Decision needed before apply: Yes`, `Chained PRs recommended: Yes`, `400-line budget risk: High`.