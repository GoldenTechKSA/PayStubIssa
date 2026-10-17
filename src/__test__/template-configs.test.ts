/**
 * Every template listed in public/configs/template-configs.json must load through the
 * real XML loader (including <include> resolution) and pass validateConfig.
 *
 * Set TEMPLATE_DUMP_DIR to a directory to also write each parsed config as JSON,
 * which lets a refactor of the XML files be checked for identical parse output.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { loadPaystubConfig, validateConfig } from '../templates/components/paystub/xmlParser';

const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const templates: { configFile: string; title: string }[] = JSON.parse(
  fs.readFileSync(path.join(PUBLIC_DIR, 'configs/template-configs.json'), 'utf8')
);

// Serve /configs/... from the public folder instead of the network.
beforeAll(() => {
  (globalThis as any).fetch = async (url: string) => {
    const { pathname } = new URL(url, 'http://localhost/');
    const file = path.join(PUBLIC_DIR, decodeURIComponent(pathname));
    if (!fs.existsSync(file)) {
      return { ok: false, status: 404, statusText: 'Not Found', text: async () => '' };
    }
    return { ok: true, status: 200, statusText: 'OK', text: async () => fs.readFileSync(file, 'utf8') };
  };
});

describe('template XML configs', () => {
  it('lists templates', () => {
    expect(templates.length).toBeGreaterThan(0);
  });

  it.each(templates.map(t => [t.configFile, t.title]))('%s loads and validates', async (configFile) => {
    const config = await loadPaystubConfig(configFile);
    const result = validateConfig(config);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
    expect(config.sections.length).toBeGreaterThan(0);

    const dumpDir = process.env.TEMPLATE_DUMP_DIR;
    if (dumpDir) {
      const name = configFile.split('/')[2];
      fs.writeFileSync(path.join(dumpDir, `${name}.json`), JSON.stringify(config, null, 2));
    }
  });
});
