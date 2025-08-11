/**
 * Truncates text to a specified length and adds ellipsis if truncated
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated text with suffix if needed
 */
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (!text || text.length <= maxLength) {
    return text || '';
  }
  
  return text.slice(0, maxLength) + suffix;
};

export default truncateText;