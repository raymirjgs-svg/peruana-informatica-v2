# Attribute Data Campaign Specification

## Purpose

Backfill `product_attributes` across all 1,191 catalog products from product names (name-first, per-category, ES/EN abbreviations) with an LLM assist pass (qwen3.5:9b) for residuals. Follow the recategorization discipline: pre-campaign backup, dry-run → review → live, explicit SKIP list, confidence threshold, audit report, idempotent upserts.

## Requirements

### Requirement: Name-first per-category parser

The parser SHALL extract specs from the product name before the description, using per-category rules and Spanish/English abbreviations (I5, I7, R5, GB, TB, SSD, HDD, RTX, GTX, `"` for inches). It SHALL write typed values into `product_attributes` columns — `value_number` for numbers, `value_boolean` for booleans, `value_id` for select values, `value_text` for text — and SHALL be tested against all 1,191 products, not only in-stock rows.
(Previously: description-only loose regex missed name-carried specs.)

#### Scenario: fully specified laptop

- GIVEN name `LAPTOP HP VICTUS … I5-12450H, 8GB 512GB RTX 3050 4GB DDR6 15.6" FHD 144HZ`
- WHEN the parser runs
- THEN cpu_family=Intel, ram_gb=8, storage=512GB SSD, screen_size=15.6, has_gpu=true, gpu_model=RTX 3050

#### Scenario: spec only in description

- GIVEN a product whose name has no GPU token but whose description names a GPU
- WHEN the parser runs
- THEN no GPU value is invented from the name and the row is queued for the LLM pass

### Requirement: Unit normalization and multi-value handling

Numeric attributes SHALL be normalized to the registry unit (screen_size in inches, cm converted; storage to the declared GB/TB form). Multi-value storage strings (e.g. `1TB+512GB`) SHALL be preserved without data loss — as a multiselect value or an explicit combined value — and MUST NOT be silently reduced to one component.

#### Scenario: centimeters

- GIVEN a name carrying `39.6 cm`
- WHEN screen_size is written
- THEN the stored inches value is the converted equivalent

#### Scenario: dual storage

- GIVEN a name carrying `1TB+512GB`
- WHEN storage is written
- THEN both capacities remain represented (multiselect/combined), not dropped

### Requirement: LLM assist with threshold and veto

Residual products SHALL be offered to qwen3.5:9b. Candidates below 0.85 confidence, or on the explicit SKIP list, SHALL NOT be written and a reason SHALL be recorded. Candidate attribute codes absent from the registry (hallucinated slugs) or values absent from `attribute_values` SHALL be vetoed and logged.

#### Scenario: confident fill

- GIVEN a residual product and LLM confidence ≥ 0.85 for a registered attribute
- WHEN the LLM pass runs
- THEN the value is written to product_attributes

#### Scenario: hallucinated code vetoed

- GIVEN an LLM candidate referencing attribute code `vram_ddr7` not in the registry
- WHEN the pass runs
- THEN no row is written and the candidate is logged as vetoed

#### Scenario: low confidence or SKIP

- GIVEN confidence < 0.85 or a SKIP-listed product
- WHEN the pass runs
- THEN no write occurs and a reason is audited

### Requirement: Idempotent upsert with pre-check

Writes SHALL upsert on the unique `(product_id, attribute_id)` key, never creating duplicates, and re-runs SHALL be idempotent. Before any live write the campaign SHALL verify every target product resolves to a numeric `product_id` (codigo_interno mapping) and SHALL abort on unresolved rows.

#### Scenario: re-run

- GIVEN a completed campaign
- WHEN it runs again
- THEN no duplicate `(product_id, attribute_id)` rows exist and values are unchanged

#### Scenario: missing codigo_interno

- GIVEN a product that cannot be resolved to a product_id
- WHEN the live run starts
- THEN the campaign aborts before writing and reports the offending rows

### Requirement: Dry-run, backup, and audit

The campaign SHALL support a dry-run that writes nothing, a pre-campaign DB backup, and a live run only after review. Every run SHALL emit an audit report with per-product assignments, skips with reasons, vetoed LLM candidates, and coverage counts across all 1,191 products.

#### Scenario: dry-run safety

- GIVEN a dry-run invocation
- WHEN it completes
- THEN the `product_attributes` row count is unchanged and the audit report is produced

#### Scenario: coverage measured

- GIVEN the live run completes
- WHEN the audit report is generated
- THEN it reports parse coverage over all 1,191 products, including out-of-stock rows

## Acceptance Notes

- The existing backup `backups/peruana_informatica_20260919_222455.sql` MUST be refreshed before the live run; rollback restores it.
- The campaign MUST NOT modify price, stock, name, category_id, or images.
