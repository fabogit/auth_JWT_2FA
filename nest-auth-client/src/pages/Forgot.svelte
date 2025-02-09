<script>
  import axios from "axios";
  let email = "",
    cls = "",
    message = "";

  $: submit = async () => {
    const { status } = await axios.post("forgot", { email });
    if (status === 201) {
      cls = "success";
      message = "Email sent";
    } else {
      cls = "danger";
      message = "Email does not exist";
    }
  };
</script>

<main class="form-signin w-100 m-auto">
  {#if cls}
    <div class={`alert alert-${cls}`} role="alert">
      {message}
    </div>
  {/if}

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

    <button class="btn btn-primary w-100 py-2 mt-3" type="submit">Submit</button
    >
  </form>
</main>
