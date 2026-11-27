import { createRouter, createWebHistory } from "vue-router";
import Utils from "./config/utils.js";
import Home from "./views/Home.vue";
import Login from "./views/Login.vue";
import Register from "./views/Register.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Protected page. meta.requiresAuth marks it as "login needed".
    { path: "/", name: "home", component: Home, meta: { requiresAuth: true } },
    { path: "/login", name: "login", component: Login },
    { path: "/register", name: "register", component: Register },
    // Any unknown address goes to home (which then checks the session).
    { path: "/:pathMatch(.*)*", redirect: { name: "home" } },
  ],
});

// Guard: runs before EVERY page change.
router.beforeEach((to) => {
  // We are signed in when the saved session has a token.
  const signedIn = Boolean(Utils.getStore("user")?.token);

  // No session and the page needs one: go to the login page.
  if (to.meta.requiresAuth && !signedIn) {
    return { name: "login" };
  }

  // Already signed in and opening the login page: go to home.
  if (to.name === "login" && signedIn) {
    return { name: "home" };
  }

  // Otherwise, allow the page.
  return true;
});

export default router;