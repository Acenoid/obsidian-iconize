import { describe, expect, it, vi } from 'vitest';
import { EditorState } from '@codemirror/state';
import icon from '@lib/icon';
import IconizePlugin from '@app/main';
import { buildPositionField, refreshIconPositions } from './state';

vi.mock('obsidian', () => ({}));

const plugin = {
  app: { workspace: { iterateAllLeaves: vi.fn() } },
  getSettings: () => ({ iconIdentifier: ':' }),
} as unknown as IconizePlugin;

const getIconIds = (
  state: EditorState,
  field: ReturnType<typeof buildPositionField>,
) => {
  const iconIds: string[] = [];
  state.field(field).between(0, state.doc.length, (_from, _to, value) => {
    iconIds.push(value.iconId);
  });
  return iconIds;
};

describe('buildPositionField', () => {
  it('should add icons of icon packs loaded later with the refresh effect', () => {
    const getIconByName = vi.spyOn(icon, 'getIconByName');
    getIconByName.mockReturnValue(null);

    const field = buildPositionField(plugin);
    let state = EditorState.create({
      doc: 'Address :FarAddressCard:',
      extensions: [field],
    });
    expect(getIconIds(state, field)).toEqual([]);

    // The icon pack was loaded in the meantime.
    getIconByName.mockReturnValue({
      svgElement: '<svg></svg>',
    } as unknown as ReturnType<typeof icon.getIconByName>);
    state = state.update({ effects: refreshIconPositions.of(null) }).state;
    expect(getIconIds(state, field)).toEqual(['FarAddressCard']);

    getIconByName.mockRestore();
  });
});
