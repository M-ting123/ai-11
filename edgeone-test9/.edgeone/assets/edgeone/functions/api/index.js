export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    
    function corsJson(body, status = 200) {
      return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      });
    }
    
    let body;
    try {
      body = await request.json();
    } catch {
      return corsJson({ error: "Invalid JSON" }, 400);
    }
    
    const module = body.module;
    if (!module) {
      return corsJson({ error: "Missing module" }, 400);
    }
    
    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return corsJson({ error: "No API key" }, 500);
    }
    
    // 模拟 DeepSeek 调用
    return corsJson({ module, content: "Hello from AI" });
  }
};
