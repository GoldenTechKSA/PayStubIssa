#!/usr/bin/env node
/**
 * Normalises every pay-stub template under public/configs/template-* into ONE
 * pretty-printed paystub-config.xml per template.
 *
 *  - <include href="..."> elements are resolved inline, with the same rules the app's
 *    xmlParser uses (href relative to the including file, included root element replaces
 *    the <include>, a file included twice is dropped the second time).
 *  - Output is indented one element per line. Elements holding text (value, formula,
 *    label, style keys) are kept on one line with their text byte-for-byte unchanged,
 *    because the parser does not trim text.
 *  - Existing XML comments are kept. A "Section <id>: <table titles>" comment is added
 *    above any top-level <section> that does not already have a comment directly above it.
 *
 * Usage:  node scripts/format-template-configs.js            # rewrite in place
 *         node scripts/format-template-configs.js --check    # exit 1 if any file would change
 *
 * Prints the partial files that were inlined so they can be deleted.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const CONFIG_ROOT = path.resolve(__dirname, '../public/configs');
const INDENT = '  ';
const CHECK = process.argv.includes('--check');

const { DOMParser, XMLSerializer, Node } = new JSDOM('').window;
const parser = new DOMParser();
const serializer = new XMLSerializer();

const stripDecl = (xml) => xml.replace(/﻿/g, '').trim().replace(/^\s*<\?xml[^>]*\?>\s*/i, '');

const parseXml = (xml, file) => {
  const doc = parser.parseFromString(stripDecl(xml), 'text/xml');
  const err = doc.querySelector('parsererror');
  if (err) throw new Error(`${file}: ${err.textContent}`);
  return doc;
};

/** Resolve <include> elements in `doc`, reading partials relative to `file`. */
const resolveIncludes = (doc, file, visited, inlined, depth = 0) => {
  if (depth > 10) throw new Error(`${file}: include depth exceeded`);
  for (const inc of Array.from(doc.querySelectorAll('include[href]'))) {
    const href = inc.getAttribute('href');
    const target = path.resolve(path.dirname(file), href);
    if (visited.has(target)) { inc.remove(); continue; }
    visited.add(target);
    inlined.add(target);
    const sub = parseXml(fs.readFileSync(target, 'utf8'), target);
    resolveIncludes(sub, target, visited, inlined, depth + 1);
    inc.parentNode.replaceChild(doc.importNode(sub.documentElement, true), inc);
  }
};

const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const attrs = (el) => Array.from(el.attributes).map(a => ` ${a.name}="${escAttr(a.value)}"`).join('');

const isBlankText = (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim() === '';

const format = (node, level) => {
  const pad = INDENT.repeat(level);
  if (node.nodeType === Node.COMMENT_NODE) return `${pad}<!--${node.textContent}-->`;
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const kids = Array.from(node.childNodes);
  const open = `${pad}<${node.tagName}${attrs(node)}`;
  const hasElements = kids.some(n => n.nodeType === Node.ELEMENT_NODE);
  const hasText = kids.some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim() !== '');

  if (!hasElements) {
    // Leaf element: keep its text byte-for-byte (the parser does not trim).
    if (node.textContent === '' && !kids.some(n => n.nodeType === Node.COMMENT_NODE)) return `${open}/>`;
    const inner = kids.map(n => serializer.serializeToString(n)).join('');
    return `${open}>${inner}</${node.tagName}>`;
  }
  if (hasText) {
    // Mixed content: do not touch.
    const inner = kids.map(n => serializer.serializeToString(n)).join('');
    return `${open}>${inner}</${node.tagName}>`;
  }
  const body = kids.filter(n => !isBlankText(n)).map(k => format(k, level + 1)).filter(Boolean).join('\n');
  return `${open}>\n${body}\n${pad}</${node.tagName}>`;
};

/** Canonical string of what the parser can observe: tags, attributes, leaf text, comments. */
const canon = (node) => {
  if (node.nodeType === Node.COMMENT_NODE) return `<!--${node.textContent}-->`;
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const kids = Array.from(node.childNodes);
  const a = Array.from(node.attributes).map(x => `${x.name}=${JSON.stringify(x.value)}`).sort().join(' ');
  if (!kids.some(n => n.nodeType === Node.ELEMENT_NODE)) {
    return `<${node.tagName} ${a}>${JSON.stringify(node.textContent)}</${node.tagName}>`;
  }
  const inner = kids.filter(n => !isBlankText(n)).map(n => n.nodeType === Node.TEXT_NODE ? JSON.stringify(n.textContent) : canon(n)).join('');
  return `<${node.tagName} ${a}>${inner}</${node.tagName}>`;
};

const sectionLabel = (section) => {
  const titles = Array.from(section.querySelectorAll('header[title]'))
    .map(h => h.getAttribute('title').trim()).filter(Boolean);
  const id = section.getAttribute('id') || '?';
  return titles.length ? `Section ${id}: ${titles.join(' / ')}` : `Section ${id}`;
};

const addSectionComments = (doc) => {
  const root = doc.documentElement;
  for (const section of Array.from(root.children).filter(e => e.tagName === 'section')) {
    let prev = section.previousSibling;
    while (prev && isBlankText(prev)) prev = prev.previousSibling;
    if (prev && prev.nodeType === Node.COMMENT_NODE) continue;
    root.insertBefore(doc.createComment(` ${sectionLabel(section)} `), section);
  }
};

const run = () => {
  const dirs = fs.readdirSync(CONFIG_ROOT).filter(d => d.startsWith('template-') && fs.statSync(path.join(CONFIG_ROOT, d)).isDirectory());
  const inlinedAll = [];
  let changed = 0;

  for (const dir of dirs) {
    const file = path.join(CONFIG_ROOT, dir, 'paystub-config.xml');
    const original = fs.readFileSync(file, 'utf8');
    const doc = parseXml(original, file);
    const inlined = new Set();
    resolveIncludes(doc, file, new Set([file]), inlined);
    addSectionComments(doc);
    const out = `<?xml version='1.0' encoding='utf-8'?>\n${format(doc.documentElement, 0)}\n`;
    // Round-trip guard: output must parse and match the resolved DOM.
    const check = parseXml(out, file);
    if (canon(check.documentElement) !== canon(doc.documentElement)) {
      throw new Error(`${file}: formatted output does not round-trip`);
    }
    if (out !== original) {
      changed++;
      if (!CHECK) fs.writeFileSync(file, out, 'utf8');
    }
    for (const p of inlined) inlinedAll.push(path.relative(CONFIG_ROOT, p));
  }

  console.log(`${dirs.length} templates, ${changed} ${CHECK ? 'would change' : 'rewritten'}`);
  if (inlinedAll.length) {
    console.log(`inlined partials (${inlinedAll.length}):`);
    inlinedAll.forEach(p => console.log('  ' + p));
  }
  if (CHECK && changed) process.exit(1);
};

run();
