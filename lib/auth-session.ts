/**
 * JWT session policy for ScribeFlow (documented for thesis / production review).
 *
 * - maxAge: absolute session lifetime before re-authentication is required.
 * - updateAge: sliding window; session JWT is refreshed when the user is active.
 *
 * Revocation: JWT strategy does not support server-side instant revocation without
 * a token denylist or switching to database sessions. Sign-out clears the client
 * cookie; previously issued JWTs remain valid until maxAge unless a denylist is added.
 */
export const AUTH_SESSION = {
  MAX_AGE_SECONDS: 30 * 24 * 60 * 60,
  UPDATE_AGE_SECONDS: 24 * 60 * 60,
} as const;
