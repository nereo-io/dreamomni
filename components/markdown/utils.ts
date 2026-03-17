import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

export interface TocHeading {
  id: string;
  text: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MarkdownTokenLike = any;

function createSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function createUniqueSlug(text: string, slugCounts: Map<string, number>) {
  const baseSlug = createSlug(text) || 'section';
  const currentCount = slugCounts.get(baseSlug) ?? 0;

  slugCounts.set(baseSlug, currentCount + 1);

  if (currentCount === 0) {
    return baseSlug;
  }

  return `${baseSlug}-${currentCount}`;
}

function getHeadingText(token?: MarkdownTokenLike) {
  if (!token) {
    return '';
  }

  if (!token.children?.length) {
    return token.content.trim();
  }

  return token.children
    .map((child) => child.content)
    .join('')
    .trim();
}

export function createMarkdownRenderer() {
  const md: MarkdownIt = new MarkdownIt({
    highlight: function (str: string, lang: string) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code>${
            hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
          }</code></pre>`;
        } catch {}
      }

      return `<pre class="hljs"><code>${MarkdownIt().utils.escapeHtml(str)}</code></pre>`;
    },
  });

  const defaultHeadingOpen =
    md.renderer.rules.heading_open ??
    ((tokens, idx, options, _env, self) =>
      self.renderToken(tokens, idx, options));

  const defaultTableOpen =
    md.renderer.rules.table_open ??
    ((tokens, idx, options, _env, self) =>
      self.renderToken(tokens, idx, options));

  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const inlineToken = tokens[idx + 1];
    const slugCounts = (env.slugCounts ??= new Map<string, number>());
    const headingText = getHeadingText(inlineToken);
    const headingId = createUniqueSlug(headingText, slugCounts);

    token.attrSet('id', headingId);

    if (token.tag === 'h2') {
      token.attrSet('data-toc-heading', 'true');
    }

    return defaultHeadingOpen(tokens, idx, options, env, self);
  };

  md.renderer.rules.table_open = (tokens, idx, options, env, self) => {
    return `<div class="markdown-table-wrapper">${defaultTableOpen(
      tokens,
      idx,
      options,
      env,
      self
    )}`;
  };

  md.renderer.rules.table_close = (tokens, idx, options, _env, self) => {
    return `${self.renderToken(tokens, idx, options)}</div>`;
  };

  return md;
}

export function extractH2Headings(content: string): TocHeading[] {
  const md = createMarkdownRenderer();
  const tokens = md.parse(content, {});
  const slugCounts = new Map<string, number>();
  const headings: TocHeading[] = [];

  tokens.forEach((token, index) => {
    if (token.type !== 'heading_open' || token.tag !== 'h2') {
      return;
    }

    const headingText = getHeadingText(tokens[index + 1]);

    if (!headingText) {
      return;
    }

    headings.push({
      id: createUniqueSlug(headingText, slugCounts),
      text: headingText,
    });
  });

  return headings;
}
