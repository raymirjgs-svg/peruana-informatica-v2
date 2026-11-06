# Facets API Specification

## Purpose

Expose EAV attribute data through the public catalog API: filter `/api/products` by per-category attributes, return per-facet counts, and publish the facet schema for a category. Preserve existing listing behavior, keep heavy payloads detail-only, and keep Redis cache keys correct and invalidated.

## API Surface

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/products` | GET | none | Existing listing + facet filters + facet counts |
| `/api/categories/:slug/attributes` | GET | none | Facet schema for a category |

Facet filter params: `filter[<attribute_code>]=<value>` (repeatable or comma-separated for multiselect), combinable with existing `category`, `brand`, `minPrice`, `maxPrice`, `search`, `sort`.

## Requirements

### Requirement: Attribute filtering on listing

`GET /api/products` SHALL accept attribute filter params and return only products whose `product_attributes` satisfy ALL supplied filters (AND across attributes, OR within a multiselect). Unknown attribute codes SHALL be ignored without altering results. Existing filters and the `is_active=1 AND stock>0` public gate SHALL remain in force.

#### Scenario: single facet filter

- GIVEN laptops with ram_gb 8 and 16
- WHEN `GET /api/products?category=laptops&filter[ram_gb]=8`
- THEN only laptops with ram_gb=8 are returned

#### Scenario: unknown code ignored

- GIVEN a request with `filter[not_a_code]=x`
- WHEN the listing runs
- THEN the result set is identical to the same request without that param

### Requirement: Per-facet counts

The listing response SHALL include a `facets` object with, for each filterable category attribute, its available values and product counts given the current filter set. Heavy per-product attribute payloads SHALL NOT be added to listing items.

#### Scenario: counts present

- GIVEN `GET /api/products?category=laptops`
- WHEN the response is inspected
- THEN `facets` lists ram_gb, storage, cpu_family, etc. with a count per value
- AND listing items do not carry full specification rows

#### Scenario: counts reflect filters

- GIVEN an active brand filter
- WHEN facet counts are computed
- THEN counts reflect the filtered result set

### Requirement: Facet schema endpoint

`GET /api/categories/:slug/attributes` SHALL return the category's filterable attributes ordered by `display_order`, each with `code`, `name`, `input_type`, `unit`, `is_filterable`, and its select/multiselect values. An unknown category slug SHALL return HTTP 404.

#### Scenario: laptop schema

- GIVEN category `laptops`
- WHEN the schema endpoint is called
- THEN it returns the laptop attributes with input types and values

#### Scenario: unknown category

- GIVEN a non-existent slug
- WHEN the endpoint is called
- THEN the response is HTTP 404

### Requirement: Facet-aware cache

Facet requests SHALL flow through `cacheSuccessMiddleware`; distinct query combinations SHALL produce distinct cache keys (sorted-query keying). Attribute/value CRUD SHALL invalidate both `attributes:*` and `products:*` caches.

#### Scenario: distinct keys

- GIVEN two requests with different filter params
- WHEN both are cached
- THEN their cache keys differ and each returns its own result

#### Scenario: invalidation on attribute write

- GIVEN a cached facet response
- WHEN an attribute is created, updated, or deleted
- THEN `attributes:*` and `products:*` cache entries are invalidated

### Requirement: Detail preserves full specs

`GET /api/products/:id` and `/api/products/slug/:slug` SHALL continue to include the full `specifications`/attribute detail; the listing SHALL omit that heavy payload.

#### Scenario: detail intact

- GIVEN a product with attribute rows
- WHEN its detail endpoint is called
- THEN the full specifications are present

## Acceptance Notes

- Zero storefront visual change: no existing response field consumed by clients may change; `facets` is additive.
- Graceful degradation applies: attribute or DB errors MUST NOT break the catalog listing.
