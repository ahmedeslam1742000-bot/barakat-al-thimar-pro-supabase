import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.locale('ar');
dayjs.extend(relativeTime);

/**
 * Formats a date to YYYY-MM-DD.
 * @param {string|number|Date|dayjs.Dayjs} date - The date to format.
 * @returns {string} The formatted date string.
 */
export const formatDate = (date) => {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD');
};

/**
 * Formats a date to a readable Arabic format (e.g. 15 مايو 2026).
 * @param {string|number|Date|dayjs.Dayjs} date - The date to format.
 * @returns {string} The formatted Arabic date.
 */
export const formatArabicDate = (date) => {
  if (!date) return '';
  return dayjs(date).format('D MMMM YYYY');
};

/**
 * Returns a relative time string (e.g. منذ ساعتين).
 * @param {string|number|Date|dayjs.Dayjs} date - The date to format.
 * @returns {string} The relative time string.
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  return dayjs(date).fromNow();
};

export default dayjs;