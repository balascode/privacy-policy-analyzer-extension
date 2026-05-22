// Configure endpoints in priority order.
// For production, set hostedApiUrl to the public Vercel proxy/rewrite URL.
window.API_CONFIG = {
  hostedApiUrl: "https://redirect-heruko-pp.vercel.app/analyze",
  localApiUrl: "http://127.0.0.1:8000/analyze",
};
