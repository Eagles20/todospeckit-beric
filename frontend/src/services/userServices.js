import apiClient from "./services.js";

// Profile calls. The shared client adds /todo/ and the Bearer token.

const getUser = (userId) => apiClient.get(`users/${userId}`);

const updateUser = (userId, payload) => apiClient.put(`users/${userId}`, payload);

export default { getUser, updateUser };
