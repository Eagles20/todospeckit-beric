import apiClient from "./services.js";

// All auth API calls live here, so views never call axios directly.
// apiClient already adds the base URL (/todo/) and the Bearer token.

// Create a new account.
// data = { fName, lName, email, username, password }
const register = (data) => apiClient.post("register", data);

// Sign in. credentials = { username, password }
// On success, response.data has userId, username, email, fName, lName, role, token.
const login = (credentials) => apiClient.post("login", credentials);

// Sign out. The Bearer token is added automatically by the request interceptor.
const logout = () => apiClient.post("logout");

export default { register, login, logout };