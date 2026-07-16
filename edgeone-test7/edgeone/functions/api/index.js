export default {
  async fetch(request, env) {
    const resp = await fetch("https://httpbin.org/get");
    const data = await resp.json();
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  }
};
