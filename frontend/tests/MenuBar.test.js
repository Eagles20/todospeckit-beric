/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import MenuBar from "../src/components/MenuBar.vue";
import userServices from "../src/services/userServices.js";
import authServices from "../src/services/authServices.js";
import Utils from "../src/config/utils.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/userServices.js", () => ({
  default: {
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

vi.mock("../src/services/authServices.js", () => ({
  default: {
    logout: vi.fn(),
  },
}));

const sessionUser = {
  userId: 6,
  username: "janeprofile",
  email: "jane.profile@example.com",
  fName: "Jane",
  lName: "Doe",
  role: "worker",
  token: "test-token",
};

const MenuHarness = {
  components: { MenuBar },
  template: "<v-app><MenuBar /></v-app>",
};

let activeWrapper;

async function mountMenu() {
  Utils.setStore("user", sessionUser);
  const mounted = await mountWithPlugins(MenuHarness, { attachTo: document.body });
  activeWrapper = mounted.wrapper;
  await flushPromises();
  return mounted;
}

async function openProfile() {
  const button = document.body.querySelector('[aria-label="Account"]');
  expect(button).toBeTruthy();
  button.click();
  await flushPromises();
}

async function clickButton(text) {
  const button = [...document.body.querySelectorAll("button")].find(
    (item) => item.textContent?.trim() === text
  );
  expect(button).toBeTruthy();
  button.click();
  await flushPromises();
}

function fieldByLabel(label) {
  const labels = [...document.body.querySelectorAll("label")];
  const match = labels.find((item) => item.textContent?.trim().startsWith(label));
  const id = match?.getAttribute("for");
  return id ? document.getElementById(id) : null;
}

async function setField(label, value) {
  const input = fieldByLabel(label);
  expect(input).toBeTruthy();
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await flushPromises();
}

describe("Feature 4 — Profile menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    authServices.logout.mockResolvedValue({ data: { message: "Signed out successfully." } });
    userServices.getUser.mockResolvedValue({
      data: {
        id: 6,
        fName: "Jane",
        lName: "Doe",
        email: "jane.profile@example.com",
        username: "janeprofile",
        role: "worker",
      },
    });
  });

  afterEach(() => {
    activeWrapper?.unmount();
    activeWrapper = undefined;
    document.body.innerHTML = "";
  });

  describe("US-4.1 — View profile from the menu bar", () => {
    it("User opens the profile dropdown from the menu bar", async () => {
      await mountMenu();
      await openProfile();

      expect(document.body.textContent).toContain("Jane Doe");
      expect(document.body.textContent).toContain("janeprofile");
      expect(document.body.textContent).toContain("jane.profile@example.com");
      expect(document.body.textContent).toContain("Edit Profile");
      expect(document.body.textContent).toContain("Log out");
    });
  });

  describe("US-4.2 — Edit profile", () => {
    it("User opens the edit profile dialog", async () => {
      await mountMenu();
      await openProfile();
      await clickButton("Edit Profile");

      expect(document.body.textContent).toContain("Edit Profile");
      expect(fieldByLabel("First name").value).toBe("Jane");
      expect(fieldByLabel("Last name").value).toBe("Doe");
      expect(fieldByLabel("Email").value).toBe("jane.profile@example.com");
      expect(fieldByLabel("Username").value).toBe("janeprofile");
    });

    it("User cancels the edit profile dialog", async () => {
      await mountMenu();
      await openProfile();
      await clickButton("Edit Profile");
      await setField("First name", "Janet");
      await clickButton("Cancel");

      expect(document.querySelector(".v-overlay--active")).toBeNull();
      expect(userServices.updateUser).not.toHaveBeenCalled();
      expect(Utils.getStore("user").fName).toBe("Jane");
    });

    it("User saves profile changes", async () => {
      userServices.updateUser.mockResolvedValue({
        data: {
          id: 6,
          fName: "Janet",
          lName: "Doe",
          email: "janet@example.com",
          username: "janet",
          role: "worker",
        },
      });

      await mountMenu();
      await openProfile();
      await clickButton("Edit Profile");
      await setField("First name", "Janet");
      await setField("Email", "janet@example.com");
      await setField("Username", "janet");
      await clickButton("Save");

      expect(userServices.updateUser).toHaveBeenCalledWith(6, {
        fName: "Janet",
        lName: "Doe",
        email: "janet@example.com",
        username: "janet",
      });
      expect(Utils.getStore("user")).toMatchObject({
        userId: 6,
        fName: "Janet",
        lName: "Doe",
        email: "janet@example.com",
        username: "janet",
        token: "test-token",
      });
      expect(document.querySelector(".v-overlay--active")).toBeNull();

      await openProfile();
      expect(document.body.textContent).toContain("Janet Doe");
      expect(document.body.textContent).toContain("janet");
      expect(document.body.textContent).toContain("janet@example.com");
    });

    it("User saves profile with invalid email format", async () => {
      const { wrapper } = await mountMenu();
      await openProfile();
      await clickButton("Edit Profile");

      const emailField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((field) => field.props("label") === "Email");
      await emailField.setValue("notanemail");
      await clickButton("Save");

      expect(document.body.textContent).toContain("Enter a valid email address.");
      expect(userServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with mismatched passwords", async () => {
      const { wrapper } = await mountMenu();
      await openProfile();
      await clickButton("Edit Profile");

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields.find((field) => field.props("label") === "New password").setValue("password123");
      await fields
        .find((field) => field.props("label") === "Confirm password")
        .setValue("different");
      await clickButton("Save");

      expect(document.body.textContent).toContain("Passwords do not match.");
      expect(userServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with a password that is too short", async () => {
      const { wrapper } = await mountMenu();
      await openProfile();
      await clickButton("Edit Profile");

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields.find((field) => field.props("label") === "New password").setValue("short");
      await fields.find((field) => field.props("label") === "Confirm password").setValue("short");
      await clickButton("Save");

      expect(document.body.textContent).toContain("Password must be at least 8 characters.");
      expect(userServices.updateUser).not.toHaveBeenCalled();
    });

    it("Profile update API returns an error", async () => {
      userServices.updateUser.mockRejectedValue({
        response: { data: { message: "Username is already taken." } },
      });

      await mountMenu();
      await openProfile();
      await clickButton("Edit Profile");
      await clickButton("Save");

      expect(document.body.textContent).toContain("Username is already taken.");
      expect(document.querySelector(".v-alert")).toBeTruthy();
      expect(document.querySelector(".v-overlay--active")).toBeTruthy();
    });
  });

  describe("US-4.3 — Log out from profile", () => {
    it("User logs out from the profile dropdown", async () => {
      const { wrapper, router } = await mountMenu();
      await openProfile();

      const logOut = wrapper
        .findAllComponents({ name: "VListItem" })
        .find((item) => item.text().includes("Log out"));
      expect(logOut).toBeTruthy();
      const push = vi.spyOn(router, "push");
      await logOut.trigger("click");
      await push.mock.results[0].value;

      expect(authServices.logout).toHaveBeenCalled();
      expect(Utils.getStore("user")).toBeNull();
      expect(router.currentRoute.value.name).toBe("login");
    });
  });

  describe("US-4.4 — Single logout entry point", () => {
    it("Menu bar does not show Sign out", async () => {
      await mountMenu();

      const signOut = [...document.body.querySelectorAll("button")].find(
        (item) => item.textContent?.trim() === "Sign out"
      );
      expect(signOut).toBeUndefined();
    });
  });
});
