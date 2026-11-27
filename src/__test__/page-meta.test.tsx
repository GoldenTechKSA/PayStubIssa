// Each page has its own title and description. They are what a search result shows, so they
// must cover every page, differ from one another, fit a result, and stay true.
import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import { RouteMeta } from '../components/common/route-meta';
import { NOT_FOUND_META, PAGE_META, pageMetaFor, SITE_ORIGIN } from '../constants/page-meta';

const root = path.resolve(__dirname, '..', '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

const HOME_DESCRIPTION = 'The description index.html was built with.';
// The tags live in <head>, which Testing Library's queries do not reach.
// eslint-disable-next-line testing-library/no-node-access
const head = (selector: string) => document.head.querySelector(selector);
const content = (selector: string) => head(selector)?.getAttribute('content');

describe('page titles and descriptions', () => {
  it('cover exactly the routes of the app and the addresses in the sitemap', () => {
    const routes = Array.from(read('src/components/app.tsx').matchAll(/<Route\s+path="([^"]+)"/g))
      .map(m => m[1])
      .filter(p => p !== '*');
    const sitemap = Array.from(read('public/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g))
      .map(m => m[1].slice(SITE_ORIGIN.length));
    expect(Object.keys(PAGE_META).sort()).toEqual(routes.sort());
    expect(Object.keys(PAGE_META).sort()).toEqual(sitemap.sort());
  });

  it('are different on every page and fit a search result', () => {
    const all = [...Object.values(PAGE_META), NOT_FOUND_META];
    const titles = all.map(m => m.title);
    const descriptions = all.map(m => m.description).filter((d): d is string => d !== null);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    expect(titles.every(t => t.length >= 10 && t.length <= 60)).toBe(true);
    expect(Object.values(PAGE_META).every(m => m.description === null || (m.description.length >= 70 && m.description.length <= 160))).toBe(true);
  });

  it('only the home page keeps the description built into index.html', () => {
    const builtIn = Object.entries(PAGE_META).filter(([, m]) => m.description === null).map(([p]) => p);
    expect(builtIn).toEqual(['/']);
    expect(read('public/index.html')).toContain(`<title>${PAGE_META['/'].title}</title>`);
  });

  it('make no claim the site must not make, and name no price', () => {
    const text = [...Object.values(PAGE_META), NOT_FOUND_META].map(m => `${m.title} ${m.description ?? ''}`).join(' ');
    expect(text).not.toMatch(/proof of income|accountant|certified|guarantee[ds]? acceptance|accepted by|\$\s?\d/i);
  });

  it('match a path whatever its case or trailing slash, as the router does', () => {
    expect(pageMetaFor('/faqpage/').canonicalPath).toBe('/FAQPage');
    expect(pageMetaFor('/').canonicalPath).toBe('/');
    expect(pageMetaFor('/nope')).toEqual({ meta: NOT_FOUND_META, canonicalPath: null });
  });
});

describe('<RouteMeta>', () => {
  beforeAll(() => {
    document.head.innerHTML = `<title>built in</title><meta name="description" content="${HOME_DESCRIPTION}">`;
  });

  it('writes the title, description, canonical address and Open Graph tags on each navigation', async () => {
    render(
      <MemoryRouter initialEntries={['/offers']}>
        <RouteMeta />
        <Routes>
          <Route path="/offers" element={<Link to="/">home</Link>} />
          <Route path="/" element={<Link to="/faqpage">faq</Link>} />
          <Route path="/FAQPage" element={<Link to="/missing">gone</Link>} />
          <Route path="*" element={<Link to="/terms">terms</Link>} />
          <Route path="/terms" element={<div>terms page</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(document.title).toBe(PAGE_META['/offers'].title);
    expect(content('meta[name="description"]')).toBe(PAGE_META['/offers'].description);
    expect(content('meta[property="og:title"]')).toBe(PAGE_META['/offers'].title);
    expect(content('meta[property="og:description"]')).toBe(PAGE_META['/offers'].description);
    expect(content('meta[property="og:url"]')).toBe(`${SITE_ORIGIN}/offers`);
    expect(head('link[rel="canonical"]')?.getAttribute('href')).toBe(`${SITE_ORIGIN}/offers`);

    // Home: its own title, and the description the page was built with comes back.
    await userEvent.click(screen.getByText('home'));
    expect(document.title).toBe(PAGE_META['/'].title);
    expect(content('meta[name="description"]')).toBe(HOME_DESCRIPTION);
    expect(head('link[rel="canonical"]')?.getAttribute('href')).toBe(`${SITE_ORIGIN}/`);

    // A differently-cased address is the same page, with the one official address.
    await userEvent.click(screen.getByText('faq'));
    expect(document.title).toBe(PAGE_META['/FAQPage'].title);
    expect(head('link[rel="canonical"]')?.getAttribute('href')).toBe(`${SITE_ORIGIN}/FAQPage`);
    expect(head('meta[name="robots"]')).toBeNull();

    // Not a page: named as such, kept out of search indexes, no official address.
    await userEvent.click(screen.getByText('gone'));
    expect(document.title).toBe(NOT_FOUND_META.title);
    expect(content('meta[name="robots"]')).toBe('noindex');
    expect(head('link[rel="canonical"]')).toBeNull();
    expect(head('meta[property="og:url"]')).toBeNull();

    // Back on a real page the noindex is lifted again.
    await userEvent.click(screen.getByText('terms'));
    expect(document.title).toBe(PAGE_META['/terms'].title);
    expect(head('meta[name="robots"]')).toBeNull();
    expect(head('link[rel="canonical"]')?.getAttribute('href')).toBe(`${SITE_ORIGIN}/terms`);
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
  });
});
