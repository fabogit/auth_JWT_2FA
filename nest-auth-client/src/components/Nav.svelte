<script>
  import { link } from "svelte-spa-router";
  import { isAuthenticated } from "../store/auth";
  import axios from "axios";

  let isAuth = false;
  isAuthenticated.subscribe((value) => (isAuth = value));

  $: logout = async () => {
    await axios.delete("logout", {}, { withCredentials: true });
    isAuthenticated.set(false);
    axios.defaults.headers.common.Authorization = "";
  };
</script>

<header class="p-3 text-bg-dark">
  <div class="container">
    <div
      class="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start"
    >
      <ul
        class="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0"
      >
        <li>
          <a href="/" use:link class="nav-link px-2 text-white">Home</a>
        </li>
      </ul>

      {#if isAuth}
        <div class="text-end">
          <a
            on:click={logout}
            href="/login"
            use:link
            class="btn btn-outline-light me-2">Logout</a
          >
        </div>
      {:else}
        <div class="text-end">
          <a href="/login" use:link class="btn btn-outline-light me-2">Login</a>

          <a href="/register" use:link class="btn btn-outline-light me-2"
            >Register</a
          >
        </div>
      {/if}
    </div>
  </div>
</header>
