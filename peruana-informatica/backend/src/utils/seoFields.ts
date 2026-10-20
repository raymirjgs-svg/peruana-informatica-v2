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

export function pickSeoSettingsFields(body: any): Record<string, any> {
  const data: Record<string, any> = {};

  for (const field of SEO_SETTINGS_EDITABLE_FIELDS) {
    if (body && Object.prototype.hasOwnProperty.call(body, field)) {
      data[field] = body[field];
    }
  }

  return data;
}
