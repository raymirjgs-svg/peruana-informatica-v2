export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return dateString;
  }
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[áäâàã]/g, 'a')
    .replace(/[éëêè]/g, 'e')
    .replace(/[íïîì]/g, 'i')
    .replace(/[óöôòõ]/g, 'o')
    .replace(/[úüûù]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getStatusOptions() {
  return [
    { value: 'draft', label: 'Borrador', color: 'gray' },
    { value: 'published', label: 'Publicado', color: 'green' },
    { value: 'scheduled', label: 'Programado', color: 'blue' },
    { value: 'archived', label: 'Archivado', color: 'red' },
  ];
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    published: 'bg-green-100 text-green-700 border-green-200',
    scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
    archived: 'bg-red-100 text-red-700 border-red-200'
  };
  return statusColors[status] || statusColors.draft || '';
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export function generateExcerpt(content: string, maxLength: number = 160): string {
  const plainText = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  const truncated = plainText.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  if (lastSpaceIndex > maxLength - 20) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }

  return truncated + '...';
}

export function getTagsArray(tags?: string): string[] {
  if (!tags) return [];
  return tags.split(',').map(tag => tag.trim()).filter(Boolean);
}

export function getCategoriesArray(categories?: string): string[] {
  if (!categories) return [];
  return categories.split(',').map(cat => cat.trim()).filter(Boolean);
}
