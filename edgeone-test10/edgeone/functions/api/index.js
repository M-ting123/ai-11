export default {
  async fetch(request, env) {
    // 测试 ?. 和 ?? 运算符
    const obj = { a: { b: "test" } };
    const val = obj?.a?.b ?? "default";
    
    // 测试 for...of 和 Object.entries
    const arr = [1, 2, 3];
    let sum = 0;
    for (const item of arr) {
      sum += item;
    }
    
    const map = { x: 1, y: 2 };
    for (const [k, v] of Object.entries(map)) {
      sum += v;
    }
    
    return new Response(JSON.stringify({ val, sum }));
  }
};
