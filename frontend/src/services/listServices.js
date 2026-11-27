import apiClient from "./services.js";

// All list API calls live here, so the dashboard never calls axios directly.
// The shared client adds /todo/ and the Bearer token.

// Get this user's lists, already sorted A to Z by the server.
const getLists = () => apiClient.get("lists");

// Create a list. The server sets the owner from the session.
const createList = (name) => apiClient.post("lists", { name });

// Rename a list this user owns.
const updateList = (id, name) => apiClient.put(`lists/${id}`, { name });

// Delete a list this user owns.
const deleteList = (id) => apiClient.delete(`lists/${id}`);

export default { getLists, createList, updateList, deleteList };
