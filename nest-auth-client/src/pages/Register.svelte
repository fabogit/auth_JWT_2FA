<script>
  import axios from "axios";
  import { push } from "svelte-spa-router";

  let first_name = "";
  let last_name = "";
  let email = "";
  let password = "";
  let password_confirm = "";

  $: submit = async () => {
    await axios.post("http://localhost:8000/api/register", {
      first_name,
      last_name,
      email,
      password,
      password_confirm,
    });

    await push("/login");
  };
</script>

<main class="form-signin w-100 m-auto">
  <form on:submit|preventDefault={submit}>
    <h1 class="h3 mb-3 fw-normal">Please Register</h1>

    <div class="form-floating">
      <input
        bind:value={first_name}
        class="form-control"
        id="first-name"
        placeholder="First Name"
      />
      <label for="first-name">First Name</label>
    </div>

    <div class="form-floating">
      <input
        bind:value={last_name}
        class="form-control"
        id="last-name"
        placeholder="Last Name"
      />
      <label for="last-name">Last Name</label>
    </div>

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
