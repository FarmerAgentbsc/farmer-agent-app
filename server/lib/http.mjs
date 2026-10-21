export class RequestError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function parseJsonBody(req, limit = 64 * 1024) {
  const chunks = [];
  let size = 0;
  // Keep the request readable when rejecting a large body so the client can
  // receive the 413 response instead of a connection reset.
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > limit) {
      req.resume();
      throw new RequestError(413, "JSON body exceeds the 64 KiB limit");
    }
    chunks.push(chunk);
  }
  if (size === 0) return {};
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new RequestError(400, "Invalid JSON body");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new RequestError(400, "JSON body must be an object");
  }
  return body;
}

export function escapeHtml(value) {
  const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value).replace(/[&<>"']/g, (character) => entities[character]);
}
