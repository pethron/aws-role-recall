import { build } from 'esbuild';

const isProduction = process.env.NODE_ENV === 'production';

// Build the background script
build({
  entryPoints: ['src/background/background.ts'], // Background entry point
  bundle: true,                                  // Bundle dependencies
  outfile: 'out-tsc/background/background.js',    // Output file
  platform: 'browser',                           // Target browser runtime
  target: 'es2020',                              // Use modern JavaScript
  sourcemap: !isProduction,                      // Enable sourcemaps in development
  minify: isProduction,                          // Minify in production
  external: [],                                  // Exclude libraries (if any)
}).catch(() => process.exit(1));
