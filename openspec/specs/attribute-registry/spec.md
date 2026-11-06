# Attribute Registry Specification

## Purpose

Replace the PC-builder-only `component_type` keying of the dead EAV attribute stack with category-bound attribute definitions. Ensure `attributes`, `attribute_values`, and `product_attributes` exist on any DB via `runMigrations.ts`, seed per-category definitions for every category with parseable spec data (laptops, proyectores, monitores, impresoras, tarjetas-video, procesadores, tablets), and seed RBAC keys for attribute administration. Existing PC Builder compatibility consumers MUST keep working unchanged.

## Requirements

### Requirement: Category binding added to attributes

The `attributes` table SHALL gain a nullable `category_id` referencing `categories(id)`, added idempotently through `runMigrations.ts`, and the Attribute model plus `associations.ts` SHALL expose `category_id` and a category→attributes association. Existing `component_type` values and the PC Builder path (`/api/compatibility/attributes/:componentType`) SHALL stay operational.
(Previously: attributes were keyed only by the `component_type` string.)

#### Scenario: migration on live DB

- GIVEN the live DB has `attributes` without `category_id`
- WHEN migrations run
- THEN `attributes.category_id` exists and is nullable
- AND re-running migrations neither errors nor duplicates

#### Scenario: PC builder unaffected

- GIVEN existing attributes with `component_type='processor'`
- WHEN `GET /api/compatibility/attributes/processor` is called
- THEN the same processor attributes are returned as before

### Requirement: EAV tables bootstrapped

`runMigrations.ts` SHALL ensure `attributes`, `attribute_values`, and `product_attributes` exist via `TABLE_MIGRATIONS` (`CREATE TABLE IF NOT EXISTS`), preserving the unique `(product_id, attribute_id)` index on `product_attributes`.

#### Scenario: fresh DB

- GIVEN a database without the EAV tables
- WHEN migrations run
- THEN all three tables exist with the unique `(product_id, attribute_id)` index

### Requirement: Per-category attribute definitions seeded

The migration SHALL seed, idempotently by unique `code`, definitions for each category with parseable data. Laptops SHALL include at least: `cpu_family` (select: Intel/AMD), `ram_gb` (number, unit GB), `storage` (select), `screen_size` (number, unit inch), `has_gpu` (boolean), `gpu_model` (text), `os` (select). Proyectores SHALL include `lumens` (number), `resolution` (select), `lamp_life` (number), `connectivity` (multiselect). Monitores, impresoras, tarjetas-video, procesadores, and tablets SHALL each receive definitions matching their measured name-carried specs. Each definition SHALL set `input_type`, `is_filterable`, `unit` where applicable, and `display_order`.

#### Scenario: laptop registry

- GIVEN migrations completed
- WHEN the facet schema for the laptops category is requested
- THEN it contains cpu_family, ram_gb, storage, screen_size, has_gpu, gpu_model, and os with their input types and is_filterable

#### Scenario: idempotent seed

- GIVEN the definitions are already seeded
- WHEN migrations re-run
- THEN no duplicate attribute codes exist

### Requirement: Select values seeded

Attributes of `input_type` select or multiselect SHALL have allowed values seeded in `attribute_values` (value + code per attribute), and `cpu_family` SHALL offer Intel and AMD.

#### Scenario: cpu_family values

- GIVEN the cpu_family attribute
- WHEN its values are read
- THEN exactly Intel and AMD are present (case-normalized)

### Requirement: Attribute RBAC seeded

`REQUIRED_PERMISSIONS` SHALL add `view-attributes`, `create-attributes`, `update-attributes`, `delete-attributes` under module `catalog`. Admin SHALL receive all four; `store-operator` SHALL receive view/create/update only, never delete.

#### Scenario: store-operator delete denied

- GIVEN the store-operator role
- WHEN it calls an attribute-delete route
- THEN the response is HTTP 403

#### Scenario: seed idempotent

- GIVEN the permissions exist
- WHEN migrations re-run
- THEN no duplicate permission rows are created

## Acceptance Notes

- Definitions are additive: no existing attribute, component_type, or compatibility row is deleted or renamed.
- Categories with no parseable data MAY have zero attributes.
