<template>
  <!-- Full-screen layout. No MenuBar in Feature 1 (the spec says so). -->
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5">
        <v-card class="pa-6 text-center" elevation="2">
          <v-card-title class="text-h5">Welcome, {{ firstName }}!</v-card-title>
          <v-card-text>
            You are signed in. Your todo lists will appear here in the next feature.
          </v-card-text>
          <v-card-actions class="justify-center">
            <!-- :loading shows a spinner on the button while the request is running -->
            <v-btn color="primary" :loading="loading" @click="signOut">Sign out</v-btn>
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

// The session saved at login. It holds fName, token, and the other fields.
const user = Utils.getStore("user");
const firstName = user?.fName || "";

// true while the sign-out request is running
const loading = ref(false);

const signOut = async () => {
  loading.value = true;
  try {
    // Ask the server to cancel our session token.
    await authServices.logout();
  } catch (error) {
    // If the server cannot be reached, we still sign out on this device.
  } finally {
    // Always remove the session from the browser, then go to the login page.
    Utils.removeItem("user");
    loading.value = false;
    router.push({ name: "login" });
  }
};
</script>