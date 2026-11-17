import { SettingsService, type CompanySettings } from '@/services/SettingsService';
import { CategoryService, type Category } from '@/services/CategoryService';

export const SWR_KEYS = {
  publicSettings: 'public-settings',
  menuCategories: 'menu-categories',
} as const;

export const fetchPublicSettings = (): Promise<CompanySettings> =>
  SettingsService.getPublicSettings();

export const fetchMenuCategories = async (): Promise<Category[]> => {
  const service = new CategoryService();
  const menu = await service.getMenuCategories();
  if (menu.length > 0) return menu;
  const all = await service.getCategories();
  return all.slice(0, 15);
};
