/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import listServices from "../src/services/listServices.js";
import todoServices from "../src/services/todoServices.js";
import { mountWithPlugins } from "./testUtils.js";
import { formatDueDate } from "../src/config/validation.js";

// The dashboard must not call the real API during these tests.
vi.mock("../src/services/listServices.js", () => ({
  default: {
    getLists: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
  },
}));

vi.mock("../src/services/todoServices.js", () => ({
  default: {
    getTodos: vi.fn(),
    createTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
  },
}));

const workList = { id: 1, name: "Work", userId: 1 };
const personalList = { id: 2, name: "Personal", userId: 1 };
const groceriesList = { id: 3, name: "Groceries", userId: 1 };

async function mountDashboard() {
  const { wrapper } = await mountWithPlugins(Dashboard, {
    attachTo: document.body,
  });
  await flushPromises();
  return wrapper;
}

// Dialog buttons are drawn outside the page, so look at the whole document.
async function clickButton(text) {
  const button = [...document.body.querySelectorAll("button")].find(
    (item) => item.textContent?.trim() === text
  );

  expect(button).toBeDefined();
  button.click();
  await flushPromises();
}

describe("Feature 2 — Dashboard lists view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    todoServices.getTodos.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("US-2.2 — View my lists", () => {
    it("User has no lists", async () => {
      listServices.getLists.mockResolvedValue({ data: [] });

      const wrapper = await mountDashboard();

      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
      expect(wrapper.text()).toContain("My Lists");
    });

    it("Dashboard loads with existing lists", async () => {
      listServices.getLists.mockResolvedValue({ data: [workList, personalList] });

      const wrapper = await mountDashboard();

      expect(wrapper.text()).toContain("Work");
      expect(wrapper.text()).toContain("Personal");
      expect(wrapper.findAll('[aria-label="Edit list"]')).toHaveLength(2);
      expect(wrapper.findAll('[aria-label="Delete list"]')).toHaveLength(2);
    });
  });

  describe("US-2.3 — Manage list rows", () => {
    it("List rows show edit and delete actions", async () => {
      listServices.getLists.mockResolvedValue({ data: [groceriesList] });

      const wrapper = await mountDashboard();

      expect(wrapper.text()).toContain("Groceries");
      expect(wrapper.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Delete list"]').exists()).toBe(true);
    });
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      listServices.getLists.mockResolvedValue({ data: [] });
      listServices.createList.mockResolvedValue({ data: groceriesList });

      const wrapper = await mountDashboard();

      await clickButton("+ New List");
      const nameField = wrapper.findComponent({ name: "VTextField" });
      await nameField.setValue("Groceries");
      await clickButton("Create");

      expect(listServices.createList).toHaveBeenCalledWith("Groceries");
      expect(wrapper.text()).toContain("Groceries");
      // The add dialog is closed after a successful create.
      expect(document.querySelector(".v-overlay--active")).toBeNull();
    });

    it("User creates a list with an empty name", async () => {
      listServices.getLists.mockResolvedValue({ data: [] });

      await mountDashboard();

      await clickButton("+ New List");
      await clickButton("Create");

      expect(document.body.textContent).toContain("List name is required.");
      expect(listServices.createList).not.toHaveBeenCalled();
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      listServices.getLists.mockResolvedValue({ data: [groceriesList] });
      listServices.updateList.mockResolvedValue({
        data: { id: 3, name: "Shopping", userId: 1 },
      });

      const wrapper = await mountDashboard();

      await wrapper.get('[aria-label="Edit list"]').trigger("click");
      await flushPromises();

      const renameField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((field) => field.props("modelValue") === "Groceries");
      await renameField.setValue("Shopping");
      await clickButton("Save");

      expect(listServices.updateList).toHaveBeenCalledWith(3, "Shopping");
      expect(wrapper.text()).toContain("Shopping");
      expect(wrapper.text()).not.toContain("Groceries");
    });

    it("User deletes a list", async () => {
      listServices.getLists.mockResolvedValue({ data: [groceriesList, personalList] });
      listServices.deleteList.mockResolvedValue({});

      const wrapper = await mountDashboard();

      await wrapper.findAll('[aria-label="Delete list"]')[0].trigger("click");
      await flushPromises();
      await clickButton("Delete");

      expect(listServices.deleteList).toHaveBeenCalledWith(3);
      expect(wrapper.text()).not.toContain("Groceries");
      expect(wrapper.text()).toContain("Personal");
    });
  });
});

const milkTodo = {
  id: 30,
  listId: 3,
  title: "Buy milk",
  completed: false,
  userId: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const workTodos = [
  { id: 10, listId: 1, title: "Email client", completed: false, userId: 1, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: 11, listId: 1, title: "Write report", completed: false, userId: 1, createdAt: "2026-01-02T00:00:00.000Z" },
];

async function clickLastButton(text) {
  const buttons = [...document.body.querySelectorAll("button")].filter(
    (item) => item.textContent?.trim() === text
  );
  expect(buttons.length).toBeGreaterThan(0);
  buttons[buttons.length - 1].click();
  await flushPromises();
}

async function openItems(wrapper, listName) {
  await wrapper.get(`[aria-label="View items for ${listName}"]`).trigger("click");
  await flushPromises();
}

describe("Feature 3 — Dashboard items dialogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    listServices.getLists.mockResolvedValue({ data: [workList, personalList, groceriesList] });
    todoServices.getTodos.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      todoServices.createTodo.mockResolvedValue({ data: milkTodo });
      const wrapper = await mountDashboard();

      await openItems(wrapper, "Groceries");
      await clickButton("+ Add Item");
      const titleField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((field) => field.props("label") === "Todo title");
      await titleField.setValue("Buy milk");
      await clickLastButton("Add");

      expect(todoServices.createTodo).toHaveBeenCalledWith(3, "Buy milk");
      expect(document.body.textContent).toContain("Buy milk");
    });

    it("User adds a todo with an empty title", async () => {
      const wrapper = await mountDashboard();
      await openItems(wrapper, "Groceries");
      await clickButton("+ Add Item");
      await clickLastButton("Add");

      expect(document.body.textContent).toContain("Todo title is required.");
      expect(todoServices.createTodo).not.toHaveBeenCalled();
    });

    it("Add item is only available inside the items dialog", async () => {
      const wrapper = await mountDashboard();
      const visibleAdd = [...document.body.querySelectorAll("button")].filter(
        (button) => button.textContent?.trim() === "+ Add Item" && button.offsetParent !== null
      );

      expect(visibleAdd).toHaveLength(0);
      expect(wrapper.text()).not.toContain("+ Add Item");
      expect(todoServices.getTodos).not.toHaveBeenCalled();
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("List items dialog shows empty state", async () => {
      const wrapper = await mountDashboard();
      await openItems(wrapper, "Personal");

      expect(todoServices.getTodos).toHaveBeenCalledWith(2);
      expect(document.body.textContent).toContain("No todos in this list yet.");
    });

    it("User opens items for different lists", async () => {
      todoServices.getTodos.mockImplementation((listId) => {
        if (listId === 1) {
          return Promise.resolve({ data: workTodos });
        }
        if (listId === 2) {
          return Promise.resolve({
            data: [
              {
                id: 20,
                listId: 2,
                title: "Call mom",
                completed: false,
                userId: 1,
                createdAt: "2026-01-01T00:00:00.000Z",
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      const wrapper = await mountDashboard();
      await openItems(wrapper, "Personal");
      expect(document.body.textContent).toContain("Call mom");
      expect(document.body.textContent).not.toContain("Email client");

      await clickButton("Close");
      await openItems(wrapper, "Work");

      expect(document.body.textContent).toContain("Email client");
      expect(document.body.textContent).toContain("Write report");
      expect(document.body.textContent).not.toContain("Call mom");
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      todoServices.getTodos.mockResolvedValue({ data: [milkTodo] });
      todoServices.updateTodo.mockResolvedValue({ data: { ...milkTodo, completed: true } });
      const wrapper = await mountDashboard();
      await openItems(wrapper, "Groceries");

      await wrapper.findComponent({ name: "VCheckbox" }).vm.$emit("update:modelValue", true);
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(30, { completed: true });
      expect(document.body.innerHTML).toContain("text-decoration-line-through");
    });

    it("User marks a completed todo as incomplete", async () => {
      const done = { ...milkTodo, completed: true };
      todoServices.getTodos.mockResolvedValue({ data: [done] });
      todoServices.updateTodo.mockResolvedValue({ data: { ...milkTodo, completed: false } });
      const wrapper = await mountDashboard();
      await openItems(wrapper, "Groceries");

      await wrapper.findComponent({ name: "VCheckbox" }).vm.$emit("update:modelValue", false);
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(30, { completed: false });
      expect(document.body.innerHTML).not.toContain("text-decoration-line-through");
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      todoServices.getTodos.mockResolvedValue({ data: [milkTodo] });
      todoServices.updateTodo.mockResolvedValue({ data: { ...milkTodo, title: "Buy oat milk" } });
      const wrapper = await mountDashboard();
      await openItems(wrapper, "Groceries");
      document.body.querySelector('[aria-label="Edit todo"]').click();
      await flushPromises();

      const titleField = wrapper
        .findAllComponents({ name: "VTextField" })
        .filter((field) => field.props("label") === "Todo title")
        .at(-1);
      await titleField.setValue("Buy oat milk");
      await clickLastButton("Save");

      expect(todoServices.updateTodo).toHaveBeenCalledWith(30, {
        title: "Buy oat milk",
        dueDate: null,
      });
      expect(document.body.textContent).toContain("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      todoServices.getTodos.mockResolvedValue({ data: [milkTodo] });
      todoServices.deleteTodo.mockResolvedValue({});
      const wrapper = await mountDashboard();
      await openItems(wrapper, "Groceries");
      document.body.querySelector('[aria-label="Delete todo"]').click();
      await flushPromises();
      await clickLastButton("Delete");

      expect(todoServices.deleteTodo).toHaveBeenCalledWith(30);
    });
  });
});

function yesterdayDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function dueDateField(wrapper, which = "first") {
  const fields = wrapper
    .findAllComponents({ name: "VTextField" })
    .filter((field) => field.props("label") === "Due date");
  return which === "last" ? fields.at(-1) : fields.at(0);
}

describe("Feature 5 — Due dates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    listServices.getLists.mockResolvedValue({ data: [groceriesList] });
    todoServices.getTodos.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("US-5.1 — Set a due date when creating a todo", () => {
    it("User adds a todo with a due date", async () => {
      todoServices.createTodo.mockResolvedValue({
        data: { ...milkTodo, dueDate: "2026-07-15" },
      });
      const wrapper = await mountDashboard();
      await openItems(wrapper, "Groceries");
      await clickButton("+ Add Item");

      const titleField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((field) => field.props("label") === "Todo title");
      await titleField.setValue("Buy milk");
      await dueDateField(wrapper).setValue("2026-07-15");
      await clickLastButton("Add");

      expect(todoServices.createTodo).toHaveBeenCalledWith(3, "Buy milk", "2026-07-15");
      expect(document.body.textContent).toContain(formatDueDate("2026-07-15"));
    });
  });

  describe("US-5.3 — Edit or clear a due date", () => {
    it("User sets a due date when editing a todo", async () => {
      todoServices.getTodos.mockResolvedValue({ data: [milkTodo] });
      todoServices.updateTodo.mockResolvedValue({ data: { ...milkTodo, dueDate: "2026-07-20" } });
      const wrapper = await mountDashboard();
      await openItems(wrapper, "Groceries");
      document.body.querySelector('[aria-label="Edit todo"]').click();
      await flushPromises();

      await dueDateField(wrapper, "last").setValue("2026-07-20");
      await clickLastButton("Save");

      expect(todoServices.updateTodo).toHaveBeenCalledWith(30, {
        title: "Buy milk",
        dueDate: "2026-07-20",
      });
      expect(document.body.textContent).toContain(formatDueDate("2026-07-20"));
    });

    it("User clears a due date when editing a todo", async () => {
      const dated = { ...milkTodo, dueDate: "2026-07-20" };
      todoServices.getTodos.mockResolvedValue({ data: [dated] });
      todoServices.updateTodo.mockResolvedValue({ data: { ...milkTodo, dueDate: null } });
      const wrapper = await mountDashboard();
      await openItems(wrapper, "Groceries");
      document.body.querySelector('[aria-label="Edit todo"]').click();
      await flushPromises();

      await dueDateField(wrapper, "last").setValue("");
      await clickLastButton("Save");

      expect(todoServices.updateTodo).toHaveBeenCalledWith(30, {
        title: "Buy milk",
        dueDate: null,
      });
      expect(document.body.textContent).not.toContain(formatDueDate("2026-07-20"));
    });
  });

  describe("US-5.4 — Spot overdue todos", () => {
    it("Incomplete todo past due date is styled as overdue", async () => {
      const past = yesterdayDate();
      todoServices.getTodos.mockResolvedValue({
        data: [{ ...milkTodo, dueDate: past, completed: false }],
      });
      const wrapper = await mountDashboard();
      await openItems(wrapper, "Groceries");

      const date = document.body.querySelector(".todo-due-date");
      expect(date.textContent).toContain(formatDueDate(past));
      expect(date.classList.contains("text-error")).toBe(true);
    });

    it("Completed todo past due date is not styled as overdue", async () => {
      const past = yesterdayDate();
      todoServices.getTodos.mockResolvedValue({
        data: [{ ...milkTodo, dueDate: past, completed: true }],
      });
      const wrapper = await mountDashboard();
      await openItems(wrapper, "Groceries");

      const date = document.body.querySelector(".todo-due-date");
      expect(date.textContent).toContain(formatDueDate(past));
      expect(date.classList.contains("text-error")).toBe(false);
    });
  });
});


