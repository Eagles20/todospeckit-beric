import apiClient from "./services.js";

// Todo calls for one list, or for one todo by id.
// The shared client adds /todo/ and the Bearer token.

const getTodos = (listId) => apiClient.get(`lists/${listId}/todos`);

// dueDate is optional. Leave it out when the person did not pick a date.
const createTodo = (listId, title, dueDate) => {
  const body = { title };
  if (dueDate) {
    body.dueDate = dueDate;
  }
  return apiClient.post(`lists/${listId}/todos`, body);
};

// changes can include title and/or completed.
const updateTodo = (id, changes) => apiClient.put(`todos/${id}`, changes);

const deleteTodo = (id) => apiClient.delete(`todos/${id}`);

export default { getTodos, createTodo, updateTodo, deleteTodo };
