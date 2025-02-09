<script>
  import axios from "axios";
  import { push } from "svelte-spa-router";
  import { isAuthenticated } from "../store/auth";

  let email = "";
  let password = "";

  $: submit = async () => {
    const response = await axios.post(
      "login",
      {
        email,
        password,
      },
      // refresh token
      { withCredentials: true }
    );

    // set access token and store status
    axios.defaults.headers.common.Authorization = `Bearer ${response.data.token}`;
    isAuthenticated.set(true);

    await push("/");
  };
</script>

<main class="form-signin w-100 m-auto">
  <form on:submit|preventDefault={submit}>
    <h1 class="h3 mb-3 fw-normal">Please Log-in</h1>

    <div class="form-floating">
      <input
        bind:value={email}
        type="email"
        class="form-control"
        id="email"
        placeholder="name@example.com"
      />
      <label for="email">Email address</label>
    </div>

    <div class="form-floating">
      <input
        bind:value={password}
        type="password"
        class="form-control"
        id="password"
        placeholder="Password"
      />
      <label for="password">Password</label>
    </div>

    <button class="btn btn-primary w-100 py-2" type="submit">Submit</button>
  </form>
</main>
