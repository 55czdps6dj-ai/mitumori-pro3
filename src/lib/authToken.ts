const encoder = new TextEncoder();

const base64UrlEncode = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const base64UrlDecode = (value: string) => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const getSigningKey = async (secret: string) =>
  crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );

export const createAuthToken = async (secret: string) => {
  const payload = base64UrlEncode(
    encoder.encode(
      JSON.stringify({
        purpose: 'mitumori-pro3-auth',
        issuedAt: Date.now(),
      })
    )
  );
  const key = await getSigningKey(secret);
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  return `${payload}.${base64UrlEncode(new Uint8Array(signature))}`;
};

export const verifyAuthToken = async (
  token: string | undefined,
  secret: string
) => {
  if (!token || !token.includes('.')) return false;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const key = await getSigningKey(secret);
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlDecode(signature),
    encoder.encode(payload)
  );
  if (!isValid) return false;

  try {
    const decoded = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(payload))
    );
    return decoded?.purpose === 'mitumori-pro3-auth';
  } catch {
    return false;
  }
};
