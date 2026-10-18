/**
 * Development-only switches, read from the page URL.
 *
 * `?dev=unlock` on /create skips the wizard to the Review step with print/PDF unlocked, so a
 * template or PDF change can be checked without filling every step and paying. It is gated on
 * NODE_ENV, which Create React App fixes at build time: under `npm run build` the check below
 * is a constant `false`, the branch is dead code and is dropped from the production bundle, so
 * the deployed site never reads the parameter. (`npm start` and `npm test` are not production.)
 */
export const isDevUnlock = (search: string): boolean =>
  process.env.NODE_ENV !== "production" && new URLSearchParams(search).get("dev") === "unlock";
