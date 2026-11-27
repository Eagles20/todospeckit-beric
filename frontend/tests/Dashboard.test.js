/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import listServices from "../src/services/listServices.js";
import { mountWithPlugins } from "./testUtils.js";

// The dashboard must not call the real API during these tests.
vi.mock("../src/services/listServices.js", () => ({
  default: {
    getLists: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
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
