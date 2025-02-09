import axios from "axios";

axios.defaults.baseURL = "http://localhost:8000/api/";

let isRefreshed = false;

axios.interceptors.response.use(
  /**
   * Success handler for response interceptor.
   * Just returns the response.
   * @param resp - The axios response object.
   * @returns The same axios response object.
   */
  function succes(resp) {
    return resp;
  },
  /**
   * Error handler for response interceptor.
   * Handles 401 Unauthorized errors by attempting to refresh the token.
   * If refresh is successful, it retries the original request.
   * @async
   * @param error - The axios error object.
   * @returns - A promise that resolves to either the original axios response (if refresh and retry are successful) or the original error object.
   */
  async function rejected(error) {
    // if unathorized refresh token
    if (error.response?.status === 401 && !isRefreshed) {
      isRefreshed = true;

      const { data, status } = await axios.post(
        "refresh",
        {},
        { withCredentials: true }
      );
      if (status === 200) {
        axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
        return axios(error.config);
      }
    }
    isRefreshed = false;
    return error;
  }
);
