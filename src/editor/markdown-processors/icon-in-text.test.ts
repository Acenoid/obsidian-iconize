import { beforeEach, describe, expect, it, vi } from 'vitest';
import { processIconInTextMarkdown } from './icon-in-text';

vi.mock('@app/lib/icon', () => ({
  default: {
    getIconByName: (name: string) =>
      name === 'LiWrench'
        ? {
            svgElement: '<svg viewBox="0 0 24 24"><path d="M0 0"></path></svg>',
          }
        : null,
  },
}));

const waitForMutations = () => new Promise((resolve) => setTimeout(resolve, 0));

// happy-dom does not implement `Text.wholeText`.
if (document.createTextNode('').wholeText === undefined) {
  Object.defineProperty(Text.prototype, 'wholeText', {
    get(this: Text) {
      return this.data;
    },
  });
}

describe('processIconInTextMarkdown', () => {
  let plugin: any;

  beforeEach(() => {
    plugin = {
      getSettings: (): any => ({
        iconIdentifier: ':',
        emojiStyle: 'native',
      }),
    };

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

  it('should replace icon shortcodes in the rendered element', () => {
    const element = document.createElement('div');
    element.innerHTML = '<p>Icon :LiWrench: here</p>';

    processIconInTextMarkdown(plugin, element);

    const icon = element.querySelector('.cm-iconize-icon');
    expect(icon?.getAttribute('data-icon')).toBe('LiWrench');
    expect(element.textContent).toBe('Icon  here');
  });

  it('should replace icon shortcodes in content that is rendered later', async () => {
    const element = document.createElement('div');
    const codeBlock = document.createElement('div');
    element.appendChild(codeBlock);

    processIconInTextMarkdown(plugin, element);

    // Simulates an asynchronously rendered code block, e.g. a Meta Bind select.
    codeBlock.innerHTML =
      '<div class="mb-select-input-element"><span>:LiWrench: 5</span></div>';
    await waitForMutations();

    const icon = codeBlock.querySelector('.cm-iconize-icon');
    expect(icon?.getAttribute('data-icon')).toBe('LiWrench');
    expect(codeBlock.textContent).toBe(' 5');
  });

  it('should replace icon shortcodes in text that changes later', async () => {
    const element = document.createElement('div');
    element.innerHTML = '<span>loading</span>';

    processIconInTextMarkdown(plugin, element);

    element.querySelector('span')!.firstChild!.nodeValue = ':LiWrench:';
    await waitForMutations();

    expect(element.querySelector('.cm-iconize-icon')).not.toBeNull();
  });

  it('should not replace icon shortcodes in code that is rendered later', async () => {
    const element = document.createElement('div');
    element.innerHTML = '<pre><code></code></pre>';

    processIconInTextMarkdown(plugin, element);

    element.querySelector('code')!.innerHTML = '<span>:LiWrench:</span>';
    await waitForMutations();

    expect(element.querySelector('.cm-iconize-icon')).toBeNull();
    expect(element.textContent).toBe(':LiWrench:');
  });
});
