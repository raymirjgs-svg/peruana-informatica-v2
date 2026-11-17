'use client';

import { Facebook, Instagram, Twitter, Linkedin, Share2 } from 'lucide-react';
import type { CompanySettingsForm } from './types';

interface SocialTabProps {
  formData: CompanySettingsForm;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function SocialTab({ formData, onChange }: SocialTabProps) {
  return (
    <div className="p-6 animate-fadeIn">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Share2 className="h-5 w-5 text-pink-600" />
        Redes Sociales
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Facebook</label>
          <div className="relative">
            <input
              type="url"
              name="facebook_url"
              value={formData.facebook_url}
              onChange={onChange}
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
              placeholder="https://facebook.com/usuario"
            />
            <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Instagram</label>
          <div className="relative">
            <input
              type="url"
              name="instagram_url"
              value={formData.instagram_url}
              onChange={onChange}
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
              placeholder="https://instagram.com/usuario"
            />
            <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-pink-600" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Twitter / X</label>
          <div className="relative">
            <input
              type="url"
              name="twitter_url"
              value={formData.twitter_url}
              onChange={onChange}
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              placeholder="https://twitter.com/usuario"
            />
            <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sky-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn</label>
          <div className="relative">
            <input
              type="url"
              name="linkedin_url"
              value={formData.linkedin_url}
              onChange={onChange}
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-blue-700 transition-all"
              placeholder="https://linkedin.com/company/usuario"
            />
            <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
