#!/usr/bin/env node
// Local stand-in for Neon's HTTP SQL API and WebSocket proxy, in front of plain
// PostgreSQL. Lets the REAL @neondatabase/serverless driver (neon() over HTTP,
// Pool over WebSocket) run against a local database for dev, CI and browser tests.
//
//   LOCAL_PG_URL=postgresql://stakr:stakr@localhost:5432/stakr_dev?sslmode=disable \
//     node scripts/local-neon-proxy.mjs
//
// Then run the app with the same DATABASE_URL (lib/db/local-neon.ts points the
// driver here when the URL host is localhost). Never connects anywhere except
// the local database named by LOCAL_PG_URL.
import http from 'node:http'
import net from 'node:net'
import pg from 'pg'
import { WebSocketServer } from 'ws'

const target = new URL(process.env.LOCAL_PG_URL ?? '')
if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(target.hostname)) {
  console.error(`refusing: LOCAL_PG_URL host '${target.hostname}' is not local`)
  process.exit(2)
}
const port = Number(process.env.STAKR_LOCAL_NEON_PORT ?? 4444)
const pool = new pg.Pool({ connectionString: process.env.LOCAL_PG_URL, max: 10 })
// Return every column as raw text, exactly like Neon's Neon-Raw-Text-Output mode;
// the driver parses by type id on the client.
const rawText = { getTypeParser: () => (value) => value }

async function run(client, { query, params }) {
  const res = await client.query({ text: query, values: params ?? [], rowMode: 'array', types: rawText })
  return {
    command: res.command,
    rowCount: res.rowCount,
    rows: res.rows,
    rowAsArray: true,
    fields: res.fields.map((f) => ({
      name: f.name,
      tableID: f.tableID,
      columnID: f.columnID,
      dataTypeID: f.dataTypeID,
      dataTypeSize: f.dataTypeSize,
      dataTypeModifier: f.dataTypeModifier,
      format: 'text',
    })),
  }
}

async function handleSql(body) {
  if (Array.isArray(body.queries)) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const results = []
      for (const q of body.queries) results.push(await run(client, q))
      await client.query('COMMIT')
      return { results }
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {})
      throw error
    } finally {
      client.release()
    }
  }
  return run(pool, body)
}

const server = http.createServer(async (req, res) => {
  const headers = {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
  }
  if (req.method === 'OPTIONS') return res.writeHead(204, headers).end()
  if (req.method !== 'POST' || req.url !== '/sql') return res.writeHead(404, headers).end('{}')
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  try {
    const out = await handleSql(JSON.parse(Buffer.concat(chunks).toString('utf8')))
    res.writeHead(200, headers).end(JSON.stringify(out))
  } catch (error) {
    const { message, severity, code, detail, hint, position, where, schema, table, column, constraint } = error
    res.writeHead(400, headers).end(
      JSON.stringify({ message, severity, code, detail, hint, position, where, schema, table, column, constraint }),
    )
  }
})

// WebSocket <-> TCP byte pipe for the driver's Pool (interactive transactions).
const wss = new WebSocketServer({ noServer: true })
server.on('upgrade', (req, socket, head) => {
  if (!req.url?.startsWith('/v1')) return socket.destroy()
  wss.handleUpgrade(req, socket, head, (ws) => {
    // The client's ?address= is ignored on purpose: only the local DB is reachable.
    const tcp = net.connect(Number(target.port || 5432), target.hostname.replace(/^\[|\]$/g, ''))
    ws.on('message', (data) => tcp.write(data))
    tcp.on('data', (data) => ws.send(data))
    ws.on('close', () => tcp.destroy())
    tcp.on('close', () => ws.close())
    ws.on('error', () => tcp.destroy())
    tcp.on('error', () => ws.close())
  })
})

server.listen(port, '127.0.0.1', () => console.log(`local neon proxy on :${port} -> ${target.host}${target.pathname}`))
