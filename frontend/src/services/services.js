import axios from "axios";
import Utils from "../config/utils.js";
import router from "../router.js";

const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? "http://localhost:3200/todo/" : "/todo/",
  withCredentials: true,
});

// NEW: These requests are allowed without a session. A 401 from them means
// "wrong username or password", so the page shows the error and we do NOT redirect.
const PUBLIC_REQUESTS = ["login", "register"];

// Before every request: add the session token (if we have one) to the headers.
apiClient.interceptors.request.use((config) => {
  const user = Utils.getStore("user");

  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

// After every response: if a protected request gets 401, the session is no longer valid.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || "";
    // NEW: find out if this was the login or register request.
    const requestUrl = error.config?.url || "";
    const isPublicRequest = PUBLIC_REQUESTS.some((name) => requestUrl.endsWith(name));

    // NEW: only protected requests clear the session and redirect.
    if (!isPublicRequest && (error.response?.status === 401 || /Unauthorized/i.test(message))) {
      Utils.removeItem("user");
      if (router.hasRoute("login")) {
        router.push({ name: "login" });
      }
    }

    // Always pass the error on, so the page can show the message.
    return Promise.reject(error);
  }
);

export default apiClient;