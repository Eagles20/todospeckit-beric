<template>
  <!-- Full-screen auth layout. No MenuBar here. -->
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5">
        <v-card class="pa-6" elevation="2">
          <v-card-title class="text-h5">Create account</v-card-title>

          <v-card-text>
            <v-alert v-if="errorMessage" type="error" class="mb-4">
              {{ errorMessage }}
            </v-alert>

            <v-form ref="formRef" @submit.prevent="submit">
              <v-text-field v-model="fName" label="First name" :rules="fNameRules" />
              <v-text-field v-model="lName" label="Last name" :rules="lNameRules" />
              <!-- emailRules is shared from validation.js (required + format). -->
              <v-text-field v-model="email" label="Email" :rules="emailRules" autocomplete="email" />
              <v-text-field
                v-model="username"
                label="Username"
                :rules="usernameRules"
                autocomplete="username"
              />
              <v-text-field
                v-model="password"
                label="Password"
                type="password"
                :rules="passwordRules"
                autocomplete="new-password"
              />
              <v-text-field
                v-model="confirmPassword"
                label="Confirm password"
                type="password"
                :rules="confirmRules"
                autocomplete="new-password"
              />
              <v-btn type="submit" color="primary" class="oc-cta mt-2" block :loading="loading">
                Create account
              </v-btn>
            </v-form>
          </v-card-text>

          <v-card-actions class="justify-center">
            <v-btn variant="text" :to="{ name: 'login' }">I already have an account</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";
import authServices from "../services/authServices.js";

const router = useRouter();

const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const formRef = ref(null);
const loading = ref(false);
const errorMessage = ref("");

// Rules: true when OK, or the message to show when not OK.
const fNameRules = [(value) => !!value?.trim() || "First name is required."];
const lNameRules = [(value) => !!value?.trim() || "Last name is required."];
const usernameRules = [(value) => !!value?.trim() || "Username is required."];
const passwordRules = [
  (value) => !!value?.trim() || "Password is required.",
  (value) => (value && value.length >= 8) || "Password must be at least 8 characters.",
];
// The confirm field must equal the password field.
const confirmRules = [(value) => value === password.value || "Passwords do not match."];

const submit = async () => {
  errorMessage.value = "";

  // Validate first. If anything is wrong, stop here. No API request is sent.
  const { valid } = await formRef.value.validate();
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    // confirmPassword is only for the screen. We do not send it to the API.
    const response = await authServices.register({
      fName: fName.value.trim(),
      lName: lName.value.trim(),
      email: email.value.trim(),
      username: username.value.trim(),
      password: password.value,
    });
    // The API returns the session, so the user is signed in right away.
    Utils.setStore("user", response.data);
    router.push({ name: "home" });
  } catch (error) {
    // Example: "Username is already taken."
    errorMessage.value =
      error.response?.data?.message || "Something went wrong. Please try again.";
  } finally {
    loading.value = false;
  }
};
</script>