<script>
  import axios from "axios";
  import { push } from "svelte-spa-router";

  let password = "";
  let password_confirm = "";

  export let params;

  $: submit = async () => {
    await axios.post("reset", {
      token: params.token,
      password,
      password_confirm,
    });

    await push("/login");
  };
</script>

<main class="form-signin w-100 m-auto">
  <form on:submit|preventDefault={submit}>
    <h1 class="h3 mb-3 fw-normal">Reset password</h1>

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

    <div class="form-floating">
      <input
        bind:value={password_confirm}
        type="password"
        class="form-control"
        id="password-confirm"
        placeholder="Password Confirm"
      />
      <label for="password-confirm">Password Confirm</label>
    </div>

    <button class="btn btn-primary w-100 py-2" type="submit">Submit</button>
  </form>
</main>
