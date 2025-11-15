export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map((ip) => ip.trim());
    if (ips.length > 0) {
      return ips[0];
    }
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return request.headers.get('remote-addr');
}

export function getUserAgent(request: Request): string | null {
  return request.headers.get('user-agent');
}

export function getReferrer(request: Request): string | null {
  return request.headers.get('referer') ?? request.headers.get('referrer');
}
