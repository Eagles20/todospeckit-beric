<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";
import authServices from "../services/authServices.js";
import userServices from "../services/userServices.js";

const router = useRouter();

// The session saved at login. Updated after a successful profile save.
const user = ref(Utils.getStore("user"));
const menuOpen = ref(false);
const editOpen = ref(false);
const editForm = ref(null);
const saving = ref(false);
const signingOut = ref(false);
const editError = ref("");

const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");

const fullName = computed(() =>
  [user.value?.fName, user.value?.lName].filter(Boolean).join(" ")
);

const refreshUser = () => {
  user.value = Utils.getStore("user");
};

const fNameRules = [(value) => !!value?.trim() || "First name is required."];
const lNameRules = [(value) => !!value?.trim() || "Last name is required."];
const usernameRules = [(value) => !!value?.trim() || "Username is required."];
// Password is optional. If they type one, it must be at least 8 characters.
const passwordRules = [
  (value) => !value || value.length >= 8 || "Password must be at least 8 characters.",
];
const confirmRules = [
  (value) => {
    if (!password.value && !value) {
      return true;
    }
    return value === password.value || "Passwords do not match.";
  },
];

const openEdit = async () => {
  menuOpen.value = false;
  editError.value = "";
  password.value = "";
  confirmPassword.value = "";

  const stored = user.value || {};
  try {
    const response = await userServices.getUser(stored.userId);
    fName.value = response.data.fName;
    lName.value = response.data.lName;
    email.value = response.data.email;
    username.value = response.data.username;
  } catch (error) {
    fName.value = stored.fName || "";
    lName.value = stored.lName || "";
    email.value = stored.email || "";
    username.value = stored.username || "";
  }

  editOpen.value = true;
};

const closeEdit = () => {
  editOpen.value = false;
  editError.value = "";
  password.value = "";
  confirmPassword.value = "";
};

const saveProfile = async () => {
  editError.value = "";
  const { valid } = await editForm.value.validate();
  if (!valid) {
    return;
  }

  const payload = {
    fName: fName.value.trim(),
    lName: lName.value.trim(),
    email: email.value.trim(),
    username: username.value.trim(),
  };
  // Send a new password only when the person typed one.
  if (password.value) {
    payload.password = password.value;
  }

  saving.value = true;
  try {
    const response = await userServices.updateUser(user.value.userId, payload);
    const stored = Utils.getStore("user") || {};
    Utils.setStore("user", {
      ...stored,
      userId: response.data.id,
      fName: response.data.fName,
      lName: response.data.lName,
      email: response.data.email,
      username: response.data.username,
      role: response.data.role,
    });
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    refreshUser();
    closeEdit();
  } catch (error) {
    editError.value = error.response?.data?.message || "Failed to update profile.";
  } finally {
    saving.value = false;
  }
};

const logOut = async () => {
  signingOut.value = true;
  try {
    await authServices.logout();
  } catch (error) {
    // If the server cannot be reached, we still sign out on this device.
  } finally {
    Utils.removeItem("user");
    signingOut.value = false;
    router.push({ name: "login" });
  }
};

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
});
</script>

<template>
  <v-app-bar color="primary" flat>
    <v-spacer />
    <v-menu v-model="menuOpen" location="bottom end">
      <template #activator="{ props }">
        <v-btn icon="mdi-account-circle" aria-label="Account" v-bind="props" />
      </template>

      <v-card min-width="280" class="pa-2">
        <v-list-item :title="fullName" :subtitle="user?.username">
          <template #subtitle>
            <div>{{ user?.username }}</div>
            <div>{{ user?.email }}</div>
          </template>
        </v-list-item>
        <v-card-actions class="px-4">
          <v-btn color="primary" variant="elevated" class="oc-cta" @click="openEdit">
            Edit Profile
          </v-btn>
        </v-card-actions>
        <v-list-item title="Log out" :disabled="signingOut" @click="logOut" />
      </v-card>
    </v-menu>
  </v-app-bar>

  <v-dialog v-model="editOpen" max-width="480">
    <v-card>
      <v-card-item>
        <v-card-title>Edit Profile</v-card-title>
      </v-card-item>
      <v-card-text>
        <v-form ref="editForm" @submit.prevent="saveProfile">
          <v-text-field v-model="fName" label="First name" :rules="fNameRules" />
          <v-text-field v-model="lName" label="Last name" :rules="lNameRules" />
          <v-text-field v-model="email" label="Email" :rules="emailRules" />
          <v-text-field v-model="username" label="Username" :rules="usernameRules" />
          <v-text-field
            v-model="password"
            label="New password"
            type="password"
            :rules="passwordRules"
          />
          <v-text-field
            v-model="confirmPassword"
            label="Confirm password"
            type="password"
            :rules="confirmRules"
          />
          <v-alert v-if="editError" type="error" class="mt-2">{{ editError }}</v-alert>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" color="secondary" @click="closeEdit">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          :loading="saving"
          @click="saveProfile"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
