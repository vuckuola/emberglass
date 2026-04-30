import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT_DIR = process.cwd()
const DIST_DIR = join(ROOT_DIR, 'dist')
const ASSETS_DIR = join(DIST_DIR, 'assets')
const GENERATED_DIR = join(ASSETS_DIR, 'generated')
const INDEX_HTML = join(DIST_DIR, 'index.html')
const HEALTH_FILE = join(DIST_DIR, 'healthz.json')
const MANIFEST_FILE = join(GENERATED_DIR, 'asset-manifest.json')
const VITE_CONFIG = join(ROOT_DIR, 'vite.config.ts')

function fail(message) {
  console.error(`LAUNCH CHECK FAILED: ${message}`)
  process.exit(1)
}

function assertExists(path, label) {
  if (!existsSync(path)) {
    fail(`${label} missing at ${path}`)
  }
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    fail(`${label} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function readBasePath() {
  if (!existsSync(VITE_CONFIG)) {
    return '/'
  }

  const viteConfigText = readFileSync(VITE_CONFIG, 'utf8')
  const match = viteConfigText.match(/base:\s*['"]([^'"]+)['"]/) 
  return match?.[1] ?? '/'
}

function normalizeBuiltPath(relativePath, basePath) {
  const escapedBase = basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return relativePath.replace(new RegExp(`^${escapedBase}`), '')
}

assertExists(DIST_DIR, 'dist directory')
assertExists(ASSETS_DIR, 'dist/assets directory')
assertExists(GENERATED_DIR, 'dist/assets/generated directory')
assertExists(INDEX_HTML, 'dist/index.html')
assertExists(HEALTH_FILE, 'dist/healthz.json')
assertExists(MANIFEST_FILE, 'generated asset manifest')

const basePath = readBasePath()
const html = readFileSync(INDEX_HTML, 'utf8')
const health = readJson(HEALTH_FILE, 'health file')
const manifest = readJson(MANIFEST_FILE, 'generated asset manifest')

if (health.app !== 'emberglass' || health.status !== 'ok' || health.deployment !== 'static-github-pages' || health.probe !== 'static-artifact-availability') {
  fail('healthz.json does not declare the expected app/status/deployment/probe payload')
}

const scriptMatch = html.match(/src="([^\"]*assets\/index-[^\"]+\.js)"/)
const cssMatch = html.match(/href="([^\"]*assets\/index-[^\"]+\.css)"/)

if (!scriptMatch) {
  fail('index.html does not reference the hashed entry script')
}

if (!cssMatch) {
  fail('index.html does not reference the hashed entry stylesheet')
}

for (const relative of [scriptMatch[1], cssMatch[1]]) {
  const normalized = normalizeBuiltPath(relative, basePath)
  assertExists(join(DIST_DIR, normalized), `built asset ${normalized}`)
}

const assetDirNames = readdirSync(ASSETS_DIR)
const startGameBundle = assetDirNames.find((name) => /^startGame-.*\.js$/.test(name))
if (!startGameBundle) {
  fail('dist/assets does not contain the lazy startGame bundle')
}

const manifestAssets = Array.isArray(manifest.assets) ? manifest.assets : []
if (manifestAssets.length === 0) {
  fail('asset-manifest.json has no assets listed')
}

for (const asset of manifestAssets) {
  if (!asset || typeof asset.path !== 'string') {
    fail('asset-manifest.json contains an invalid asset entry')
  }

  const normalized = asset.path.replace(/^\//, '')
  assertExists(join(DIST_DIR, normalized), `generated asset ${normalized}`)
}

const entryBundleText = readFileSync(join(ASSETS_DIR, normalizeBuiltPath(scriptMatch[1], `${basePath}assets/`)), 'utf8')
if (!entryBundleText.includes('startGame-')) {
  fail('entry bundle does not reference the lazy startGame chunk')
}

console.log('Launch readiness OK')
console.log(`- Base path: ${basePath}`)
console.log(`- Entry script: ${scriptMatch[1]}`)
console.log(`- Entry stylesheet: ${cssMatch[1]}`)
console.log(`- startGame bundle: ${startGameBundle}`)
console.log(`- Generated assets listed: ${manifestAssets.length}`)
console.log(`- Deploy probe: ${basePath}healthz.json`)
