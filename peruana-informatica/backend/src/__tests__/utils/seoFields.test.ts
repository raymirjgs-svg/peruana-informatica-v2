import { pickSeoSettingsFields } from '../../utils/seoFields';

describe('pickSeoSettingsFields', () => {
  it('keeps only editable SEO fields', () => {
    const picked = pickSeoSettingsFields({
      page_type: 'home',
      meta_title: 'Title',
      meta_description: 'Description',
      id: 99,
      created_at: '2024-01-01',
      unexpected: true,
    });

    expect(picked).toEqual({
      page_type: 'home',
      meta_title: 'Title',
      meta_description: 'Description',
    });
  });

  it('returns an empty object for null or undefined input', () => {
    expect(pickSeoSettingsFields(null)).toEqual({});
    expect(pickSeoSettingsFields(undefined)).toEqual({});
  });

  it('preserves falsy values for editable fields', () => {
    const picked = pickSeoSettingsFields({ is_active: false, priority: 0 });

    expect(picked).toEqual({ is_active: false, priority: 0 });
  });
});
