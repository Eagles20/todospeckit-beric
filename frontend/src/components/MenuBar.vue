<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import Utils from "../config/utils.js";
import authServices from "../services/authServices.js";

const router = useRouter();

// The name saved at login. Show first and last name when we have them.
const user = Utils.getStore("user");
const displayName = [user?.fName, user?.lName].filter(Boolean).join(" ") || user?.username || "";

const signingOut = ref(false);

const signOut = async () => {
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
</script>

<template>
  <v-app-bar color="primary" flat>
    <v-spacer />
    <span class="mr-4">{{ displayName }}</span>
    <v-btn variant="text" :loading="signingOut" @click="signOut">Sign out</v-btn>
  </v-app-bar>
</template>
