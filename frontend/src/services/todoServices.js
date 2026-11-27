import apiClient from "./services.js";

// Todo calls for one list, or for one todo by id.
// The shared client adds /todo/ and the Bearer token.

const getTodos = (listId) => apiClient.get(`lists/${listId}/todos`);

const createTodo = (listId, title) => apiClient.post(`lists/${listId}/todos`, { title });

// changes can include title and/or completed.
const updateTodo = (id, changes) => apiClient.put(`todos/${id}`, changes);

const deleteTodo = (id) => apiClient.delete(`todos/${id}`);

export default { getTodos, createTodo, updateTodo, deleteTodo };
