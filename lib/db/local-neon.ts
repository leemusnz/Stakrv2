import { neonConfig } from "@neondatabase/serverless";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/**
 * Lets the Neon driver talk to a plain local Postgres for development, CI and
 * browser tests, via scripts/local-neon-proxy.mjs (HTTP /sql + WebSocket /v1).
 *
 * Opt-in AND local-only: it does nothing unless STAKR_LOCAL_NEON_PROXY is set
 * (e.g. "localhost:4444") and DATABASE_URL's host is literally localhost or
 * 127.0.0.1. It can never redirect traffic away from a real Neon database.
 */
export function configureLocalNeon(
  connectionString: string | undefined,
): boolean {
  const proxy = process.env.STAKR_LOCAL_NEON_PROXY;
  if (!proxy || !connectionString) return false;
  let host: string;
  try {
    host = new URL(connectionString).hostname;
  } catch {
    return false;
  }
  if (!LOCAL_HOSTS.has(host)) return false;

  neonConfig.fetchEndpoint = () => `http://${proxy}/sql`;
  neonConfig.wsProxy = () => `${proxy}/v1`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineConnect = false;
  neonConfig.pipelineTLS = false;
  return true;
}
