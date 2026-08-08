import { NextResponse } from "next/server";

/**
 * Apple App Site Association — powers iOS Universal Links for the بوحمدان app.
 *
 * Served from a route handler rather than `public/` on purpose: Apple requires
 * this file at an extensionless path with `Content-Type: application/json`, and
 * the site sends `X-Content-Type-Options: nosniff`, so a mistyped content type
 * fails silently rather than degrading.
 *
 * `appIDs` is `<appleTeamId>.<ios.bundleIdentifier>` from the app's app.json.
 * Both values must match the shipped build exactly or the link check fails.
 *
 * Only paths that the app can actually route are listed here. Adding a path the
 * app does not handle sends users to a dead end inside the app.
 */
const APPLE_TEAM_ID = "8N939SQV2K";
const IOS_BUNDLE_ID = "com.nawaf.testflightapp";

const association = {
  applinks: {
    details: [
      {
        appIDs: [`${APPLE_TEAM_ID}.${IOS_BUNDLE_ID}`],
        components: [
          { "/": "/listing/*", comment: "Listing detail" },
          { "/": "/showroom/*", comment: "Showroom detail" },
        ],
      },
    ],
  },
};

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(association);
}
