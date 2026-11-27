import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pageMetaFor, SITE_ORIGIN } from '../../constants/page-meta';

/** The description index.html was built with (the home page's, with the stamped price). */
let builtInDescription: string | null = null;

/** Find or create a <meta> by one identifying attribute, and set its content. */
function setMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeFromHead(selector: string): void {
  document.head.querySelector(selector)?.remove();
}

/**
 * Gives each page its own title and description (constants/page-meta.ts), so the browser tab,
 * history, bookmarks and search results name the page that is open instead of the home page.
 *
 * It writes, on every navigation: <title>, the description, the Open Graph title / description
 * / url, and a canonical link (the page's one official address, so `/faqpage` and `/FAQPage/`
 * are not indexed as separate pages). An address that is not a page gets "noindex" and no
 * canonical link.
 *
 * Limit: this runs in the browser. Google runs the page's JavaScript and sees it; a link
 * preview in a chat or social app reads index.html as served and shows the home page's.
 */
export const RouteMeta: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (builtInDescription === null) {
      builtInDescription =
        document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.getAttribute('content') ?? '';
    }
    const { meta, canonicalPath } = pageMetaFor(pathname);
    const description = meta.description ?? builtInDescription;

    document.title = meta.title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', meta.title);
    setMeta('property', 'og:description', description);

    if (canonicalPath) {
      const url = `${SITE_ORIGIN}${canonicalPath}`;
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', url);
      setMeta('property', 'og:url', url);
      removeFromHead('meta[name="robots"]');
    } else {
      removeFromHead('link[rel="canonical"]');
      removeFromHead('meta[property="og:url"]');
      setMeta('name', 'robots', 'noindex');
    }
  }, [pathname]);

  return null;
};

export default RouteMeta;
