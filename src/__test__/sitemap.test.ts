// The sitemap is a claim to search engines about which pages exist, so it has to stay in step
// with the router: a page added to app.tsx must be listed, and a listed page must exist.
import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { SITE_DOMAIN } from '../constants/business-info';

const root = path.resolve(__dirname, '..', '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

const sitemapPaths = () =>
  Array.from(read('public/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)).map(m => m[1]);

const routePaths = () =>
  Array.from(read('src/components/app.tsx').matchAll(/<Route\s+path="([^"]+)"/g))
    .map(m => m[1])
    .filter(p => p !== '*');

describe('sitemap.xml', () => {
  it('lists every route of the app, once, and nothing else', () => {
    const origin = `https://${SITE_DOMAIN}`;
    const listed = sitemapPaths();
    expect(listed.every(url => url.startsWith(`${origin}/`))).toBe(true);
    expect(new Set(listed).size).toBe(listed.length);
    expect(listed.map(url => url.slice(origin.length)).sort()).toEqual(routePaths().sort());
  });

  it('finds routes in app.tsx at all (the pattern still matches the file)', () => {
    expect(routePaths()).toContain('/');
    expect(routePaths().length).toBeGreaterThan(5);
  });

  it('is announced in robots.txt, which blocks nothing', () => {
    const robots = read('public/robots.txt');
    expect(robots).toContain(`Sitemap: https://${SITE_DOMAIN}/sitemap.xml`);
    expect(robots).not.toMatch(/^Disallow:[ \t]*\S/m);
  });
});
