export function isTrustedSameOriginRequest(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin) {
    return origin === requestOrigin;
  }

  if (referer) {
    return referer.startsWith(requestOrigin);
  }

  return false;
}
