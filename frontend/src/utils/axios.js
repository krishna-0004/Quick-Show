import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
});

let store = {
  accessToken: null,

  setAccessToken: (token) => {
    store.accessToken = token;
    localStorage.setItem("accessToken", token); // ✅ persist across refresh
  },

  getAccessToken: () => {
    if (!store.accessToken) {
      store.accessToken = localStorage.getItem("accessToken");
    }
    return store.accessToken;
  },

  clear: () => {
    store.accessToken = null;
    localStorage.removeItem("accessToken");
  },
};

// refresh lock
let refreshing = null;

api.interceptors.request.use((config) => {
  const token = store.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!refreshing) {
        refreshing = api
          .post("/auth/refresh")
          .then((res) => {
            const newAT = res.data.accessToken;
            store.setAccessToken(newAT);
            refreshing = null;
            return newAT;
          })
          .catch((err) => {
            store.clear();
            refreshing = null;
            throw err;
          });
      }

      const newAT = await refreshing;
      originalRequest.headers.Authorization = `Bearer ${newAT}`;
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export { api, store };
