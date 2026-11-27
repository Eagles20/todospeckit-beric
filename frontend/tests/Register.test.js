/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Register from "../src/views/Register.vue";
import authServices from "../src/services/authServices.js";
import { mountWithPlugins, createTestRouter } from "./testUtils.js";

// Replace the real API module so these tests never call the server.
vi.mock("../src/services/authServices.js", () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

async function fillRegisterForm(wrapper, overrides = {}) {
  const values = {
    fName: "Jane",
    lName: "Doe",
    email: "jane@example.com",
    username: "jdoe",
    password: "password123",
    confirmPassword: "password123",
    ...overrides,
  };

  const fields = wrapper.findAllComponents({ name: "VTextField" });
  await fields[0].setValue(values.fName);
  await fields[1].setValue(values.lName);
  await fields[2].setValue(values.email);
  await fields[3].setValue(values.username);
  await fields[4].setValue(values.password);
  await fields[5].setValue(values.confirmPassword);
}

async function submitRegisterForm(wrapper) {
  // Submit the form the same way the browser does, so the page's submit() runs.
  await wrapper.find("form").trigger("submit");
  await flushPromises();
}

describe("Feature 1 — Register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("US-1.1 — Registration", () => {
    it("User submits registration with invalid email format", async () => {
      const { wrapper } = await mountWithPlugins(Register, {
        router: await createTestRouter("/register"),
      });

      await fillRegisterForm(wrapper, { email: "notanemail" });
      await submitRegisterForm(wrapper);

      expect(wrapper.text()).toContain("Enter a valid email address.");
      expect(authServices.register).not.toHaveBeenCalled();
    });

    it("User submits registration with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Register, {
        router: await createTestRouter("/register"),
      });

      await fillRegisterForm(wrapper, { username: "" });
      await submitRegisterForm(wrapper);

      expect(wrapper.text()).toContain("Username is required.");
      expect(authServices.register).not.toHaveBeenCalled();
    });

    it("User submits registration with password too short", async () => {
      const { wrapper } = await mountWithPlugins(Register, {
        router: await createTestRouter("/register"),
      });

      await fillRegisterForm(wrapper, { password: "short", confirmPassword: "short" });
      await submitRegisterForm(wrapper);

      expect(wrapper.text()).toContain("Password must be at least 8 characters.");
      expect(authServices.register).not.toHaveBeenCalled();
    });

    it("User submits registration with mismatched passwords", async () => {
      const { wrapper } = await mountWithPlugins(Register, {
        router: await createTestRouter("/register"),
      });

      await fillRegisterForm(wrapper, { confirmPassword: "differentpassword" });
      await submitRegisterForm(wrapper);

      expect(wrapper.text()).toContain("Passwords do not match.");
      expect(authServices.register).not.toHaveBeenCalled();
    });
  });
});
