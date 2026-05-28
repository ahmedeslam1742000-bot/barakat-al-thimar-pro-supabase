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



export default dayjs;