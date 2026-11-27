<template>
  <!-- Full-screen auth layout. No MenuBar here (the spec says so). -->
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="pa-6" elevation="2">
          <v-card-title class="text-h5">Sign in</v-card-title>

          <v-card-text>
            <!-- Error box. It only shows when errorMessage has text. -->
            <v-alert v-if="errorMessage" type="error" class="mb-4">
              {{ errorMessage }}
            </v-alert>

            <!-- @submit.prevent stops the page from reloading when the form is sent. -->
            <v-form ref="formRef" @submit.prevent="submit">
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
                autocomplete="current-password"
              />
              <!-- :loading shows a spinner while the request is running. -->
              <v-btn type="submit" color="primary" class="oc-cta mt-2" block :loading="loading">
                Sign in
              </v-btn>
            </v-form>
          </v-card-text>

          <v-card-actions class="justify-center">
            <v-btn variant="text" :to="{ name: 'register' }">Create an account</v-btn>
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
import authServices from "../services/authServices.js";

const router = useRouter();

// Values typed in the form
const username = ref("");
const password = ref("");
// The form itself, so we can ask it to validate
const formRef = ref(null);
// true while the request is running
const loading = ref(false);
// Text for the red error box
const errorMessage = ref("");

// Each rule returns true if the value is OK, or the error message if not.
const usernameRules = [(value) => !!value?.trim() || "Username is required."];
const passwordRules = [(value) => !!value?.trim() || "Password is required."];

const submit = async () => {
  errorMessage.value = "";

  // Check the rules first. If a field is empty, the messages show
  // under the fields and NO API request is sent.
  const { valid } = await formRef.value.validate();
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    const response = await authServices.login({
      username: username.value.trim(),
      password: password.value,
    });
    // Save the session so we stay signed in after a refresh (key "user").
    Utils.setStore("user", response.data);
    router.push({ name: "home" });
  } catch (error) {
    // Show the server message, for example "Invalid username or password."
    errorMessage.value =
      error.response?.data?.message || "Something went wrong. Please try again.";
  } finally {
    loading.value = false;
  }
};
</script>