
import {
  createRequestContext,
  runWithRequestContext,
} from './.edgeone/dist/run/handlers/request-context.cjs';
import serverHandler from './.edgeone/dist/run/handlers/server.js';
import { getTracer } from './.edgeone/dist/run/handlers/tracer.cjs';

process.env.USE_REGIONAL_BLOBS = 'true';
export default async function handler(req, context = {}) {
  const requestContext = createRequestContext(req, context);
  const tracer = getTracer();

  const handlerResponse = await runWithRequestContext(requestContext, () => {
    return tracer.withActiveSpan('Next.js Server Handler', async (span) => {
      const response = await serverHandler(req, context, span, requestContext);
      return response;
    });
  });

  if (requestContext.serverTiming) {
    handlerResponse.headers.set('server-timing', requestContext.serverTiming);
  }

  return handlerResponse;
}

export const config = {
  path: '/*',
  preferStatic: true,
};