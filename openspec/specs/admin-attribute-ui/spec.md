# Admin Attribute UI Specification

## Purpose

Provide admin CRUD for attribute definitions and their values, plus per-category attribute inputs in the admin ProductForm that write to the EAV tables. Every route and page is guarded by the new attribute RBAC keys. No storefront visual change.

## API Surface

| Endpoint | Method | Permission |
|----------|--------|------------|
| `/api/admin/attributes?category_id=` | GET | view-attributes |
| `/api/admin/attributes` | POST | create-attributes |
| `/api/admin/attributes/:id` | PUT | update-attributes |
| `/api/admin/attributes/:id` | DELETE | delete-attributes |
| `/api/admin/attributes/:id/values` | POST | create-attributes |
| `/api/admin/attribute-values/:id` | PUT | update-attributes |
| `/api/admin/attribute-values/:id` | DELETE | delete-attributes |

## Requirements

### Requirement: Attribute CRUD guarded by RBAC

The backend SHALL expose the attribute and attribute-value admin routes above, each guarded by `checkPermission`. Writes SHALL invalidate `attributes:*` and `products:*` caches. Requests lacking the required permission SHALL return HTTP 403 and SHALL NOT mutate data.

#### Scenario: permitted create

- GIVEN a role with create-attributes
- WHEN `POST /api/admin/attributes` creates a laptop attribute
- THEN the response is HTTP 201 and the attribute exists

#### Scenario: denied delete

- GIVEN the store-operator role (no delete-attributes)
- WHEN `DELETE /api/admin/attributes/:id` is called
- THEN the response is HTTP 403 and the attribute is unchanged

#### Scenario: cache invalidated

- GIVEN cached attribute and product responses
- WHEN an attribute is updated
- THEN `attributes:*` and `products:*` caches are invalidated

### Requirement: Admin attribute pages

The admin frontend SHALL provide attribute and value management scoped per category, reachable only from admin routes and gated by the attribute permissions. The pages SHALL list attributes in `display_order` and allow editing `input_type`, `is_filterable`, `unit`, and select values.

#### Scenario: page lists attributes

- GIVEN an admin on the laptops attribute page
- WHEN the page loads
- THEN the laptop attributes are listed in display_order

#### Scenario: viewer cannot edit

- GIVEN a user without create/update-attributes
- WHEN the attribute page is opened
- THEN editing controls are not available

### Requirement: ProductForm per-category attribute inputs

The admin ProductForm SHALL render inputs for the selected category's filterable attributes (typed by `input_type`) and SHALL persist them as `product_attributes` rows (upsert on `(product_id, attribute_id)`). This SHALL replace or augment the free-text Especificaciones section for registry-backed attributes; non-registry free-text rows MAY remain.

#### Scenario: category-driven inputs

- GIVEN a product categorized as laptops
- WHEN the ProductForm loads
- THEN cpu_family, ram_gb, storage, screen_size, has_gpu, gpu_model, and os inputs are shown

#### Scenario: save to EAV

- GIVEN entered attribute values
- WHEN the product is saved
- THEN matching product_attributes rows are upserted with typed values and no duplicates

#### Scenario: changing category

- GIVEN a product re-categorized from laptops to monitores
- WHEN the form reloads
- THEN the monitor attribute inputs are shown

### Requirement: No storefront visual change

This change SHALL NOT modify public-facing components: the storefront product grid, product cards, filters sidebar, and detail layout SHALL remain pixel-identical.

#### Scenario: public render unchanged

- GIVEN the change is deployed
- WHEN the catalog and product detail pages render
- THEN their markup and styling match the pre-change baseline

## Acceptance Notes

- Admin reads require view-attributes; store-operator holds view/create/update; delete is admin-only.
- ProductForm saves MUST use the existing `product_attributes` unique key — no duplicate rows.
