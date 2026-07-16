export default {
  async fetch(request, env) {
    // 解析 JSON
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }
    
    const module = body.module;
    if (!module) {
      return new Response("Missing module", { status: 400 });
    }
    
    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return new Response("No API key", { status: 500 });
    }
    
    return new Response(JSON.stringify({ module, apiKey: apiKey ? "exists" : "missing" }));
  }
};
