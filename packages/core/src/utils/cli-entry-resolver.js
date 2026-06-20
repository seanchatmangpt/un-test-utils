import { consola } from '../index.js'
/**
 * @fileoverview CLI Entry Point Resolver
 * @description Resolves CLI entry points with support for custom paths
 */

import { existsSync, statSync, readFileSync } from 'fs'
import { resolve, extname, dirname, join } from 'pathe'
import { SmartCLIDetector } from './smart-cli-detector.js'

/**
 * Walk up from startDir looking for the nearest package.json with a "bin" field.
 * Returns the resolved path of the first bin entry, or null if not found.
 * @param {string} startDir - Directory to start walking from
 * @returns {string|null}
 */
export function findBinFromPackageJson(startDir = process.cwd()) {
  let dir = startDir
  while (true) {
    const pkgPath = join(dir, 'package.json')
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
        if (pkg.bin) {
          const bins = typeof pkg.bin === 'string'
            ? [pkg.bin]
            : Object.values(pkg.bin)
          if (bins.length > 0) {
            const resolved = resolve(dir, bins[0])
            consola.debug(`[un-test-utils] auto-detected CLI from bin field in ${pkgPath}: ${resolved}`)
            return resolved
          }
        }
      } catch {
        // ignore parse errors
      }
    }
    const parent = dirname(dir)
    if (parent === dir) break // reached filesystem root
    dir = parent
  }
  return null
}

/** Explicit CLI path set via defineCLI() — module-level override */
let _explicitCLIPath = null

/**
 * Explicitly set the CLI entry path for the current test file.
 * Works like defineConfig in Vite — call once at the top of your test file.
 * @param {string} path - Path to the CLI entry file
 */
export function defineCLI(path) {
  _explicitCLIPath = path
}

/**
 * Get the current explicit CLI path (if set via defineCLI).
 * @returns {string|null}
 */
export function getDefinedCLI() {
  return _explicitCLIPath
}

/**
 * CLI Entry Point Resolver
 * Supports both auto-detection and explicit file selection
 */
export class CLIEntryResolver {
  constructor(options = {}) {
    this.options = {
      verbose: options.verbose || false,
      ...options,
    }
    this.detector = new SmartCLIDetector({ verbose: this.options.verbose })
  }

  /**
   * Resolve CLI entry point from various sources
   * @param {Object} options - Resolution options
   * @returns {Promise<Object>} Resolved CLI path and metadata
   */
  async resolveCLIEntry(options = {}) {
    const {
      entryFile,
      cliFile,
      cliPath,
      verbose = this.options.verbose,
    } = options

    // Priority 1: Explicit --entry-file or --cli-file flag
    const explicitPath = entryFile || cliFile
    if (explicitPath) {
      return this.resolveExplicitPath(explicitPath, verbose)
    }

    // Priority 2: Legacy --cli-path (with auto-detection fallback)
    if (cliPath && cliPath !== 'src/cli.mjs') {
      return this.resolveExplicitPath(cliPath, verbose)
    }

    // Priority 3: defineCLI() override
    if (_explicitCLIPath) {
      return this.resolveExplicitPath(_explicitCLIPath, verbose)
    }

    // Priority 4: Walk up from cwd for nearest package.json bin field
    const binPath = findBinFromPackageJson(process.cwd())
    if (binPath) {
      return { cliPath: binPath, detectionMethod: 'bin-walk-up', confidence: 'high', source: 'auto-detected', validated: true }
    }

    // Priority 5: Smart auto-detection
    return this.autoDetectCLI(verbose)
  }

  /**
   * Resolve explicitly specified CLI file
   * @param {string} filePath - Explicit file path
   * @param {boolean} verbose - Enable verbose output
   * @returns {Object} Resolution result
   */
  resolveExplicitPath(filePath, verbose) {
    if (verbose) {
      console.log(`🔍 Resolving explicit CLI entry: ${filePath}`)
    }

    // Resolve to absolute path
    const resolvedPath = resolve(filePath)

    // Validate file exists
    if (!existsSync(resolvedPath)) {
      throw new Error(
        `CLI entry file not found: ${resolvedPath}\n\n` +
        `Suggestion: Use --entry-file with a valid path:\n` +
        `  $ ctu analyze --entry-file ./path/to/your/cli.js\n`
      )
    }

    // Validate it's a file
    const stat = statSync(resolvedPath)
    if (!stat.isFile()) {
      throw new Error(
        `CLI entry path is not a file: ${resolvedPath}\n\n` +
        `Suggestion: Provide a JavaScript/TypeScript file:\n` +
        `  $ ctu analyze --entry-file ./src/cli.mjs\n`
      )
    }

    // Validate it's a JavaScript file
    const ext = extname(resolvedPath)
    const validExtensions = ['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts']
    if (!validExtensions.includes(ext)) {
      throw new Error(
        `CLI entry file must be JavaScript/TypeScript: ${resolvedPath}\n` +
        `Found extension: ${ext}\n` +
        `Valid extensions: ${validExtensions.join(', ')}\n\n` +
        `Suggestion: Provide a .js, .mjs, or .ts file:\n` +
        `  $ ctu analyze --entry-file ./src/cli.mjs\n`
      )
    }

    if (verbose) {
      console.log(`✅ Resolved CLI entry: ${resolvedPath}`)
    }

    return {
      cliPath: resolvedPath,
      detectionMethod: 'explicit',
      confidence: 'high',
      source: 'user-specified',
      validated: true,
    }
  }

  /**
   * Auto-detect CLI entry point
   * @param {boolean} verbose - Enable verbose output
   * @returns {Promise<Object>} Detection result
   */
  async autoDetectCLI(verbose) {
    if (verbose) {
      console.log('🔍 Starting smart CLI auto-detection...')
    }

    const detected = await this.detector.detectCLI({ verbose })

    if (!detected || !detected.cliPath) {
      throw new Error(
        `No CLI entry point found via auto-detection.\n\n` +
        `Suggestions:\n` +
        `1. Use --entry-file to specify the CLI file explicitly:\n` +
        `   $ ctu analyze --entry-file ./path/to/your/cli.js\n\n` +
        `2. Add a "bin" field to your package.json:\n` +
        `   "bin": {\n` +
        `     "your-cli": "./path/to/cli.js"\n` +
        `   }\n\n` +
        `3. Use a conventional CLI file location:\n` +
        `   - src/cli.mjs\n` +
        `   - bin/cli.js\n` +
        `   - cli.js\n`
      )
    }

    if (verbose) {
      console.log(`✅ Auto-detected CLI: ${detected.cliPath}`)
      console.log(`   Detection method: ${detected.detectionMethod}`)
      console.log(`   Confidence: ${detected.confidence}`)
    }

    return {
      ...detected,
      source: 'auto-detected',
      validated: true,
    }
  }

  /**
   * Validate resolved CLI path
   * @param {string} cliPath - CLI path to validate
   * @returns {Object} Validation result
   */
  validateCLI(cliPath) {
    return this.detector.validateCLI(cliPath)
  }
}

/**
 * Convenience function to resolve CLI entry point
 * @param {Object} options - Resolution options
 * @returns {Promise<string>} Resolved CLI path
 */
export async function resolveCLIEntry(options) {
  const resolver = new CLIEntryResolver(options)
  const result = await resolver.resolveCLIEntry(options)
  return result.cliPath
}

/**
 * Add CLI entry arguments to command definition
 * @returns {Object} CLI entry arguments
 */
export function getCLIEntryArgs() {
  return {
    'entry-file': {
      type: 'string',
      description: 'Path to CLI entry file (default: auto-detect)',
    },
    'cli-file': {
      type: 'string',
      description: 'Alias for --entry-file',
    },
    'cli-path': {
      type: 'string',
      description: '[Deprecated] Path to CLI file (use --entry-file instead)',
      default: 'src/cli.mjs',
    },
  }
}
