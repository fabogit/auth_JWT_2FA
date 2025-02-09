<script>
  import axios from "axios";
  import { onMount } from "svelte";
  import { isAuthenticated } from "../store/auth";

  let message = "";

  onMount(async () => {
    const response = await axios.get("user");
    if (response.status === 200) {
      message = `Logged as User: ${JSON.stringify(response.data)}`;
      isAuthenticated.set(true);
    } else {
      message = "You are not logged in";
      isAuthenticated.set(false);
    }
  });
</script>

<div class="container mt-5 text-center">
  <h3>{message}</h3>
</div>
