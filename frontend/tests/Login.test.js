/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Login from "../src/views/Login.vue";
import authServices from "../src/services/authServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

async function submitLoginForm(wrapper) {
  // Submit the form the same way the browser does, so the page's submit() runs.
  await wrapper.find("form").trigger("submit");
  await flushPromises();
}

describe("Feature 1 — Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Login);

      await submitLoginForm(wrapper);

      expect(wrapper.text()).toContain("Username is required.");
      expect(authServices.login).not.toHaveBeenCalled();
    });

    it("User signs in with missing password", async () => {
      const { wrapper } = await mountWithPlugins(Login);
      const fields = wrapper.findAllComponents({ name: "VTextField" });

      await fields[0].setValue("jdoe");
      await submitLoginForm(wrapper);

      expect(wrapper.text()).toContain("Password is required.");
      expect(authServices.login).not.toHaveBeenCalled();
    });

    it("User signs in with invalid password", async () => {
      authServices.login.mockRejectedValue({
        response: { data: { message: "Invalid username or password." } },
      });

      const { wrapper } = await mountWithPlugins(Login);
      const fields = wrapper.findAllComponents({ name: "VTextField" });

      await fields[0].setValue("jdoe");
      await fields[1].setValue("wrongpassword");
      await submitLoginForm(wrapper);

      expect(authServices.login).toHaveBeenCalledWith({
        username: "jdoe",
        password: "wrongpassword",
      });
      expect(wrapper.text()).toContain("Invalid username or password.");
    });
  });
});
