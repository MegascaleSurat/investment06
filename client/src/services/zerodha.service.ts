import axios from '@/lib/axios';

/**
 * Fetch the logged-in user's Zerodha profile from the backend
 * @returns {Promise<any>} The profile data
 */
export const getZerodhaProfile = async () => {
  const res = await axios.get('/zerodha/profile');
  return res.data.data;
};
