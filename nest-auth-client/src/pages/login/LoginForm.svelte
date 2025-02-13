<script>
  import { createEventDispatcher } from "svelte";
  import { link } from "svelte-spa-router";
  import axios from "axios";

  const dispatch = createEventDispatcher();
  let email = "";
  let password = "";

  $: submit = async () => {
    const { data } = await axios.post(
      "login",
      {
        email,
        password,
      },
      // refresh token
      { withCredentials: true }
    );

    dispatch("login", data);
  };
</script>

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

  <div class="mb-3">
    <a href="/forgot" use:link>Forgot password?</a>
  </div>

  <button class="btn btn-primary w-100 py-2" type="submit">Submit</button>
</form>
