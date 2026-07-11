// Reports (honestly) whether a real AI provider is configured, so the client
// can show a "development preview — mock responses" notice when it is not.
// Never exposes the key itself.

export function GET() {
  return Response.json({
    aiConfigured: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
  });
}
