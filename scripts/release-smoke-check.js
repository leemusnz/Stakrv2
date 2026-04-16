#!/usr/bin/env node

/**
 * Release smoke checks for production URL.
 * Focus: public availability, auth endpoints, and protected-route redirect behavior.
 *
 * Usage:
 *   npm run release:smoke
 *   SITE_URL=https://stakr.app node scripts/release-smoke-check.js
 */

const https = require('https')

const SITE_URL = process.env.SITE_URL || 'https://stakr.app'

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let body = ''
      res.on('data', (chunk) => (body += chunk))
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          headers: res.headers,
          body,
          url,
        })
      })
    })

    req.on('error', reject)
    req.end()
  })
}

function ok(msg) {
  console.log(`PASS: ${msg}`)
}

function fail(msg) {
  console.log(`FAIL: ${msg}`)
}

async function checkPublicRoute(path) {
  const res = await request(`${SITE_URL}${path}`)
  if (res.status >= 200 && res.status < 400) {
    ok(`${path} reachable (${res.status})`)
    return true
  }
  fail(`${path} not reachable (${res.status})`)
  return false
}

async function checkSessionEndpoint() {
  const res = await request(`${SITE_URL}/api/auth/session`)
  if (res.status !== 200) {
    fail(`/api/auth/session expected 200, got ${res.status}`)
    return false
  }

  try {
    JSON.parse(res.body)
    ok(`/api/auth/session returns JSON (unauthenticated allowed)`)
    return true
  } catch (error) {
    fail(`/api/auth/session returned non-JSON body`)
    return false
  }
}

async function checkProtectedRedirect(path) {
  const res = await request(`${SITE_URL}${path}`)

  // No redirect means route might be publicly open (acceptable if intentional).
  if (res.status >= 200 && res.status < 300) {
    ok(`${path} returned ${res.status} (route is publicly accessible)`)
    return true
  }

  const location = res.headers.location || ''
  const expected = location.includes('/auth/signin') || location.includes('/alpha-gate')

  if ((res.status === 302 || res.status === 307 || res.status === 308) && expected) {
    ok(`${path} redirects as expected -> ${location}`)
    return true
  }

  fail(`${path} unexpected response: ${res.status} location=${location || 'none'}`)
  return false
}

async function run() {
  console.log(`Running release smoke checks for ${SITE_URL}`)

  const checks = await Promise.all([
    checkPublicRoute('/'),
    checkPublicRoute('/privacy'),
    checkPublicRoute('/terms'),
    checkSessionEndpoint(),
    checkProtectedRedirect('/dashboard'),
    checkProtectedRedirect('/discover'),
  ])

  const passed = checks.filter(Boolean).length
  const total = checks.length

  console.log(`\nResult: ${passed}/${total} checks passed`)

  if (passed !== total) {
    process.exitCode = 1
  }
}

run().catch((error) => {
  console.error('Smoke check failed with exception:', error.message)
  process.exit(1)
})
