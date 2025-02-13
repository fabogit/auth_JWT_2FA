<script>
  import axios from "axios";
  import { isAuthenticated } from "../../store/auth";
  import { push } from "svelte-spa-router";

  export let loginData = {};
  let code = "";

  $: submit = async () => {
    const { data } = await axios.post(
      "two-factor",
      {
        ...loginData,
        code,
      },
      { withCredentials: true }
    );

    axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
    isAuthenticated.set(true);
    await push("/");
  };
</script>

<form on:submit|preventDefault={submit}>
  <h1 class="h3 mb-3 fw-normal">Please insert authenticator code</h1>

  <div class="form-floating">
    <input
      bind:value={code}
      class="form-control"
      id="code"
      placeholder="6 digits code"
    />
    <label for="code">6 digits code</label>
  </div>

  <button class="btn btn-primary w-100 py-2 mt-3" type="submit">Submit</button>
</form>
