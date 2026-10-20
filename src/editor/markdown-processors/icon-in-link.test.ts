import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@app/lib/logger';
import { processIconInLinkMarkdown } from './icon-in-link';

vi.mock('@app/lib/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn() },
}));

vi.mock('@app/lib/icon', () => ({
  default: {
    getIconByPath: (_plugin: unknown, path: string) =>
      path === 'Note A.md' ? { prefix: 'Li', name: 'Wrench' } : null,
    getIconByName: () => ({
      svgElement: '<svg viewBox="0 0 24 24"><path d="M0 0"></path></svg>',
    }),
  },
}));

const SOURCE_PATH = 'Note B.md';

describe('processIconInLinkMarkdown', () => {
  let plugin: any;
  let ctx: any;

  const render = (html: string): HTMLElement => {
    const element = document.createElement('div');
    element.innerHTML = html;
    processIconInLinkMarkdown(plugin, element, ctx);
    return element;
  };

  beforeEach(() => {
    // Resolves linkpaths like Obsidian does: only the path of a link without
    // its subpath, and an empty linkpath is the note that contains the link.
    const files: Record<string, { path: string }> = {
      'Note A': { path: 'Note A.md' },
      'Note B': { path: 'Note B.md' },
    };
    plugin = {
      app: {
        metadataCache: {
          getFirstLinkpathDest: vi.fn(
            (linkpath: string, sourcePath: string) =>
              (linkpath === '' ? { path: sourcePath } : files[linkpath]) ??
              null,
          ),
        },
      },
      getIconColor: (): string | undefined => undefined,
      getSettings: (): any => ({ iconColor: 'red', emojiStyle: 'native' }),
    };
    ctx = { sourcePath: SOURCE_PATH };

    (globalThis as any).createSpan = (o: any = {}) => {
      const span = document.createElement('span');
      if (o.cls) {
        span.className = o.cls;
      }
      Object.entries(o.attr ?? {}).forEach(([key, value]) =>
        span.setAttribute(key, value as string),
      );
      return span;
    };
  });

  it('should add the icon of the note to a link', () => {
    const element = render(
      '<a data-href="Note A" href="Note A" class="internal-link">Note A</a>',
    );

    const icon = element.querySelector('a > .iconize-icon-in-link');
    expect(icon?.getAttribute('data-icon')).toBe('LiWrench');
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it.each(['Note A#Heading', 'Note A#^block', 'Note A#Heading#Subheading'])(
    'should add the icon of the note to the link "%s" with a subpath',
    (href) => {
      const element = render(
        `<a data-href="${href}" href="${href}" class="internal-link">Note A</a>`,
      );

      const icon = element.querySelector('a > .iconize-icon-in-link');
      expect(icon?.getAttribute('data-icon')).toBe('LiWrench');
      expect(
        plugin.app.metadataCache.getFirstLinkpathDest,
      ).toHaveBeenCalledWith('Note A', SOURCE_PATH);
      expect(logger.warn).not.toHaveBeenCalled();
    },
  );

  it('should add the icon of the current note to a link to its own heading', () => {
    ctx.sourcePath = 'Note A.md';

    const element = render(
      '<a data-href="#Heading" href="#Heading" class="internal-link">Heading</a>',
    );

    const icon = element.querySelector('a > .iconize-icon-in-link');
    expect(icon?.getAttribute('data-icon')).toBe('LiWrench');
  });

  it('should not add an icon to a note without an icon', () => {
    const element = render(
      '<a data-href="Note B#Heading" href="Note B#Heading">Note B</a>',
    );

    expect(element.querySelector('.iconize-icon-in-link')).toBeNull();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should not warn about a link to a note that does not exist', () => {
    const element = render(
      '<a data-href="Missing" href="Missing" class="internal-link is-unresolved">Missing</a>',
    );

    expect(element.querySelector('.iconize-icon-in-link')).toBeNull();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith(
      'Link element does not have a linkpath to a file',
    );
  });

  it('should skip links without `data-href` like tags and external links', () => {
    const element = render(
      '<a href="#tag" class="tag">#tag</a><a href="https://example.com" class="external-link">Example</a>',
    );

    expect(element.querySelector('.iconize-icon-in-link')).toBeNull();
    expect(
      plugin.app.metadataCache.getFirstLinkpathDest,
    ).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.log).not.toHaveBeenCalled();
  });

  it('should warn about an internal link without an `href` attribute', () => {
    const element = render('<a data-href="Note A">Note A</a>');

    expect(element.querySelector('.iconize-icon-in-link')).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      'Link element does not have an `href` attribute',
    );
  });
});
