import { page } from 'vitest/browser';

/**
 * Build the screenshot filename used for harness captures.
 * Convention: `{test-name}__{step-name}__{timestamp}.png` under
 * `tests/e2e/__screenshots__/`. The timestamp keeps successive runs from
 * stomping each other while still grouping by test+step alphabetically.
 *
 * Sanitizes test/step names to filesystem-safe characters (alphanumerics,
 * dash, underscore) so a test name like `"player walks N tiles east"`
 * becomes `player-walks-N-tiles-east`.
 */
export function screenshotFilename(testName: string, stepName: string): string {
  const sanitize = (s: string) => s.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return `${sanitize(testName)}__${sanitize(stepName)}__${ts}.png`;
}

/**
 * Capture a screenshot via Vitest's browser API. The path is relative to
 * the test file's directory; Vitest writes it under
 * `tests/e2e/__screenshots__/`.
 *
 * Returns the resolved path (as Vitest reports it) for logging.
 */
export async function captureScreenshot(testName: string, stepName: string): Promise<string> {
  const filename = screenshotFilename(testName, stepName);
  const path = `__screenshots__/${filename}`;
  await page.screenshot({ path });
  return path;
}
