export const dynamic = 'force-dynamic';

// Verified certificates for this app: Google Play App Signing, then the
// existing upload/release key used by directly installed APKs.
const RELEASE_SIGNING_FINGERPRINTS = [
  '8E:15:92:27:ED:9B:BC:F7:C3:A5:11:89:C6:33:E1:03:6F:CD:BD:84:02:C8:9B:83:37:FD:EA:50:7B:9E:EC:A2',
  '8E:1B:5C:23:A5:17:9A:8A:2A:E6:2B:DC:20:7D:EE:76:E4:D7:22:E0:E7:CA:61:EE:4D:31:3A:4B:65:DB:A5:B2',
];

export async function GET() {
  // Must be Play App Signing's certificate (or the distribution certificate
  // for direct APKs), not a guessed key or the debug certificate.
  const configured = (process.env.ANDROID_APP_LINKS_SHA256 || '').split(',').map(value => value.trim().toUpperCase()).filter(Boolean);
  const fingerprints = [...new Set([...RELEASE_SIGNING_FINGERPRINTS, ...configured])];
  if (!fingerprints.length || fingerprints.some(value => !/^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(value))) {
    return Response.json({ error: 'Android release signing certificate is not configured' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  return Response.json([{ relation: ['delegate_permission/common.handle_all_urls'], target: {
    namespace: 'android_app', package_name: 'com.buhamdan.app', sha256_cert_fingerprints: fingerprints,
  } }], { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
