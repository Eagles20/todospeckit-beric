<script setup>
import { onMounted, ref } from "vue";
import listServices from "../services/listServices.js";
import todoServices from "../services/todoServices.js";

const lists = ref([]);
const listsLoading = ref(false);
const listsError = ref("");

const createDialogOpen = ref(false);
const renameDialogOpen = ref(false);
const deleteDialogOpen = ref(false);

const createForm = ref(null);
const renameForm = ref(null);

const newListName = ref("");
const renameListName = ref("");
const listToRename = ref(null);
const listToDelete = ref(null);

const createLoading = ref(false);
const renameLoading = ref(false);
const deleteLoading = ref(false);
const dialogError = ref("");

const itemsDialogOpen = ref(false);
const itemsList = ref(null);
const todos = ref([]);
const todosLoading = ref(false);
const todosError = ref("");

const addTodoDialogOpen = ref(false);
const editTodoDialogOpen = ref(false);
const deleteTodoDialogOpen = ref(false);
const addTodoForm = ref(null);
const editTodoForm = ref(null);
const newTodoTitle = ref("");
const editTodoTitle = ref("");
const todoToEdit = ref(null);
const todoToDelete = ref(null);
const addTodoLoading = ref(false);
const editTodoLoading = ref(false);
const deleteTodoLoading = ref(false);
const todoDialogError = ref("");

// Empty or too-long names are stopped here, before any API call.
const listNameRules = [
  (value) => !!value?.trim() || "List name is required.",
  (value) => (value?.trim().length ?? 0) <= 100 || "List name must be 100 characters or fewer.",
];

const todoTitleRules = [
  (value) => !!value?.trim() || "Todo title is required.",
  (value) => (value?.trim().length ?? 0) <= 255 || "Todo title must be 255 characters or fewer.",
];

// Not-done tasks first, then the oldest task first.
const sortTodos = (items) =>
  [...items].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

const sortByName = (items) => [...items].sort((a, b) => a.name.localeCompare(b.name));

const loadLists = async () => {
  listsLoading.value = true;
  listsError.value = "";

  try {
    const response = await listServices.getLists();
    lists.value = response.data;
  } catch (error) {
    listsError.value = error.response?.data?.message || "Failed to load lists.";
  } finally {
    listsLoading.value = false;
  }
};

const openCreateDialog = () => {
  dialogError.value = "";
  newListName.value = "";
  createDialogOpen.value = true;
};

const closeCreateDialog = () => {
  createDialogOpen.value = false;
  newListName.value = "";
  dialogError.value = "";
};

const handleCreateList = async () => {
  dialogError.value = "";
  const { valid } = await createForm.value.validate();
  if (!valid) {
    return;
  }

  createLoading.value = true;
  try {
    const response = await listServices.createList(newListName.value.trim());
    lists.value = sortByName([...lists.value, response.data]);
    closeCreateDialog();
  } catch (error) {
    dialogError.value = error.response?.data?.message || "Failed to create list.";
  } finally {
    createLoading.value = false;
  }
};

const openRenameDialog = (list) => {
  dialogError.value = "";
  listToRename.value = list;
  renameListName.value = list.name;
  renameDialogOpen.value = true;
};

const closeRenameDialog = () => {
  renameDialogOpen.value = false;
  listToRename.value = null;
  renameListName.value = "";
  dialogError.value = "";
};

const handleRenameList = async () => {
  dialogError.value = "";
  const { valid } = await renameForm.value.validate();
  if (!valid || !listToRename.value) {
    return;
  }

  renameLoading.value = true;
  try {
    const response = await listServices.updateList(
      listToRename.value.id,
      renameListName.value.trim()
    );
    lists.value = sortByName(
      lists.value.map((list) => (list.id === response.data.id ? response.data : list))
    );
    closeRenameDialog();
  } catch (error) {
    dialogError.value = error.response?.data?.message || "Failed to rename list.";
  } finally {
    renameLoading.value = false;
  }
};

const openDeleteDialog = (list) => {
  listToDelete.value = list;
  deleteDialogOpen.value = true;
};

const closeDeleteDialog = () => {
  deleteDialogOpen.value = false;
  listToDelete.value = null;
};

const handleDeleteList = async () => {
  if (!listToDelete.value) {
    return;
  }

  deleteLoading.value = true;
  try {
    await listServices.deleteList(listToDelete.value.id);
    lists.value = lists.value.filter((list) => list.id !== listToDelete.value.id);
    if (itemsList.value?.id === listToDelete.value.id) {
      closeItemsDialog();
    }
    closeDeleteDialog();
  } catch (error) {
    listsError.value = error.response?.data?.message || "Failed to delete list.";
    closeDeleteDialog();
  } finally {
    deleteLoading.value = false;
  }
};

const loadTodos = async () => {
  if (!itemsList.value) {
    todos.value = [];
    return;
  }

  todosLoading.value = true;
  todosError.value = "";
  try {
    const response = await todoServices.getTodos(itemsList.value.id);
    todos.value = sortTodos(response.data);
  } catch (error) {
    todos.value = [];
    todosError.value = error.response?.data?.message || "Failed to load todos.";
  } finally {
    todosLoading.value = false;
  }
};

const openItemsDialog = async (list) => {
  itemsList.value = list;
  itemsDialogOpen.value = true;
  await loadTodos();
};

const closeItemsDialog = () => {
  itemsDialogOpen.value = false;
  itemsList.value = null;
  todos.value = [];
  todosError.value = "";
  closeAddTodoDialog();
  closeEditTodoDialog();
  closeDeleteTodoDialog();
};

const openAddTodoDialog = () => {
  todoDialogError.value = "";
  newTodoTitle.value = "";
  addTodoDialogOpen.value = true;
};

const closeAddTodoDialog = () => {
  addTodoDialogOpen.value = false;
  newTodoTitle.value = "";
  todoDialogError.value = "";
};

const handleAddTodo = async () => {
  todoDialogError.value = "";
  const { valid } = await addTodoForm.value.validate();
  if (!valid || !itemsList.value) {
    return;
  }

  addTodoLoading.value = true;
  try {
    const response = await todoServices.createTodo(itemsList.value.id, newTodoTitle.value.trim());
    todos.value = sortTodos([...todos.value, response.data]);
    closeAddTodoDialog();
  } catch (error) {
    todoDialogError.value = error.response?.data?.message || "Failed to add todo.";
  } finally {
    addTodoLoading.value = false;
  }
};

const openEditTodoDialog = (todo) => {
  todoDialogError.value = "";
  todoToEdit.value = todo;
  editTodoTitle.value = todo.title;
  editTodoDialogOpen.value = true;
};

const closeEditTodoDialog = () => {
  editTodoDialogOpen.value = false;
  todoToEdit.value = null;
  editTodoTitle.value = "";
  todoDialogError.value = "";
};

const handleEditTodo = async () => {
  todoDialogError.value = "";
  const { valid } = await editTodoForm.value.validate();
  if (!valid || !todoToEdit.value) {
    return;
  }

  editTodoLoading.value = true;
  try {
    const response = await todoServices.updateTodo(todoToEdit.value.id, {
      title: editTodoTitle.value.trim(),
    });
    todos.value = sortTodos(
      todos.value.map((todo) => (todo.id === response.data.id ? response.data : todo))
    );
    closeEditTodoDialog();
  } catch (error) {
    todoDialogError.value = error.response?.data?.message || "Failed to update todo.";
  } finally {
    editTodoLoading.value = false;
  }
};

const openDeleteTodoDialog = (todo) => {
  todoToDelete.value = todo;
  deleteTodoDialogOpen.value = true;
};

const closeDeleteTodoDialog = () => {
  deleteTodoDialogOpen.value = false;
  todoToDelete.value = null;
};

const handleDeleteTodo = async () => {
  if (!todoToDelete.value) {
    return;
  }

  deleteTodoLoading.value = true;
  try {
    await todoServices.deleteTodo(todoToDelete.value.id);
    todos.value = todos.value.filter((todo) => todo.id !== todoToDelete.value.id);
    closeDeleteTodoDialog();
  } catch (error) {
    todosError.value = error.response?.data?.message || "Failed to delete todo.";
    closeDeleteTodoDialog();
  } finally {
    deleteTodoLoading.value = false;
  }
};

const toggleTodoCompleted = async (todo, completed) => {
  try {
    const response = await todoServices.updateTodo(todo.id, { completed });
    todos.value = sortTodos(
      todos.value.map((item) => (item.id === response.data.id ? response.data : item))
    );
  } catch (error) {
    todosError.value = error.response?.data?.message || "Failed to update todo.";
  }
};

onMounted(() => {
  loadLists();
});
</script>

<template>
  <v-container fluid class="py-6">
    <v-alert v-if="listsError" type="error" class="mb-4">
      {{ listsError }}
    </v-alert>

    <!-- Shown only while the first request is running. -->
    <v-progress-linear v-if="listsLoading" indeterminate color="primary" class="mb-4" />

    <v-card elevation="2">
      <!-- The button stays beside the title, not inside it, so the label stays the right size. -->
      <v-card-item>
        <v-card-title>My Lists</v-card-title>
        <template #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :disabled="listsLoading"
            @click="openCreateDialog"
          >
            + New List
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <p v-if="!listsLoading && lists.length === 0" class="text-body-2">
          No lists yet. Create your first list.
        </p>

        <v-list v-else density="comfortable" class="pa-0">
          <v-list-item v-for="list in lists" :key="list.id" :title="list.name">
            <template #append>
              <v-btn
                icon="mdi-format-list-bulleted"
                variant="text"
                size="small"
                :aria-label="`View items for ${list.name}`"
                @click="openItemsDialog(list)"
              />
              <v-btn
                icon="mdi-pencil"
                variant="text"
                size="small"
                aria-label="Edit list"
                @click="openRenameDialog(list)"
              />
              <v-btn
                icon="mdi-delete"
                variant="text"
                size="small"
                aria-label="Delete list"
                @click="openDeleteDialog(list)"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <v-dialog v-model="createDialogOpen" max-width="480">
      <v-card>
        <v-card-title>New list</v-card-title>
        <v-card-text>
          <v-form ref="createForm" @submit.prevent="handleCreateList">
            <v-text-field v-model="newListName" label="List name" :rules="listNameRules" autofocus />
            <v-alert v-if="dialogError" type="error" class="mt-2">
              {{ dialogError }}
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="secondary" @click="closeCreateDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="createLoading"
            @click="handleCreateList"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="renameDialogOpen" max-width="480">
      <v-card>
        <v-card-title>Rename list</v-card-title>
        <v-card-text>
          <v-form ref="renameForm" @submit.prevent="handleRenameList">
            <v-text-field v-model="renameListName" label="List name" :rules="listNameRules" autofocus />
            <v-alert v-if="dialogError" type="error" class="mt-2">
              {{ dialogError }}
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="secondary" @click="closeRenameDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="renameLoading"
            @click="handleRenameList"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="480">
      <v-card>
        <v-card-title>Delete list</v-card-title>
        <v-card-text>
          Are you sure you want to delete <strong>{{ listToDelete?.name }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="secondary" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn color="error" variant="elevated" :loading="deleteLoading" @click="handleDeleteList">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="itemsDialogOpen" max-width="560">
      <v-card>
        <v-card-title>{{ itemsList?.name }} — Items</v-card-title>
        <v-card-text>
          <v-alert v-if="todosError" type="error" class="mb-4">{{ todosError }}</v-alert>
          <v-progress-linear v-if="todosLoading" indeterminate color="primary" class="mb-4" />
          <div class="d-flex justify-end mb-4">
            <v-btn
              color="primary"
              variant="elevated"
              class="oc-cta"
              :disabled="todosLoading"
              @click="openAddTodoDialog"
            >
              + Add Item
            </v-btn>
          </div>
          <p v-if="!todosLoading && todos.length === 0" class="text-body-2">
            No todos in this list yet.
          </p>
          <v-list v-else density="comfortable" class="pa-0">
            <v-list-item v-for="todo in todos" :key="todo.id">
              <template #prepend>
                <v-checkbox
                  :model-value="todo.completed"
                  density="compact"
                  hide-details
                  @update:model-value="toggleTodoCompleted(todo, $event)"
                />
              </template>
              <v-list-item-title
                :class="{ 'text-decoration-line-through text-medium-emphasis': todo.completed }"
              >
                {{ todo.title }}
              </v-list-item-title>
              <template #append>
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  size="small"
                  aria-label="Edit todo"
                  @click="openEditTodoDialog(todo)"
                />
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  aria-label="Delete todo"
                  @click="openDeleteTodoDialog(todo)"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="secondary" @click="closeItemsDialog">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="addTodoDialogOpen" max-width="480">
      <v-card>
        <v-card-title>Add item</v-card-title>
        <v-card-text>
          <v-form ref="addTodoForm" @submit.prevent="handleAddTodo">
            <v-text-field v-model="newTodoTitle" label="Todo title" :rules="todoTitleRules" autofocus />
            <v-alert v-if="todoDialogError" type="error" class="mt-2">{{ todoDialogError }}</v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="secondary" @click="closeAddTodoDialog">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="addTodoLoading" @click="handleAddTodo">
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editTodoDialogOpen" max-width="480">
      <v-card>
        <v-card-title>Edit item</v-card-title>
        <v-card-text>
          <v-form ref="editTodoForm" @submit.prevent="handleEditTodo">
            <v-text-field v-model="editTodoTitle" label="Todo title" :rules="todoTitleRules" autofocus />
            <v-alert v-if="todoDialogError" type="error" class="mt-2">{{ todoDialogError }}</v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="secondary" @click="closeEditTodoDialog">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="editTodoLoading" @click="handleEditTodo">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteTodoDialogOpen" max-width="480">
      <v-card>
        <v-card-title>Delete item</v-card-title>
        <v-card-text>
          Are you sure you want to delete <strong>{{ todoToDelete?.title }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="secondary" @click="closeDeleteTodoDialog">Cancel</v-btn>
          <v-btn color="error" variant="elevated" :loading="deleteTodoLoading" @click="handleDeleteTodo">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
