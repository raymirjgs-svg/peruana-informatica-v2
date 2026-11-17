const SEO_SETTINGS_EDITABLE_FIELDS = [
  "page_type",
  "page_identifier",
  "meta_title",
  "meta_description",
  "meta_keywords",
  "og_title",
  "og_description",
  "og_image",
  "twitter_title",
  "twitter_description",
  "twitter_image",
  "canonical_url",
  "robots",
  "schema_markup",
  "custom_head",
  "priority",
  "change_frequency",
  "is_active"
];

export interface SeoSettingsUpdateInput {
  page_type?: string;
  page_identifier?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  canonical_url?: string;
  robots?: string;
  schema_markup?: string;
  custom_head?: string;
  priority?: number;
  change_frequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  is_active?: boolean;
}

export function pickSeoSettingsFields(body: unknown): SeoSettingsUpdateInput {
  const data: Record<string, unknown> = {};

  if (body && typeof body === 'object') {
    const source = body as Record<string, unknown>;
    for (const field of SEO_SETTINGS_EDITABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(source, field)) {
        data[field] = source[field];
      }
    }
  }

  return data as SeoSettingsUpdateInput;
}
