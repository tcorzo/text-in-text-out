import { expect, test } from 'bun:test';
import { placePopover } from './popover';

const viewport = { width: 390, height: 844 };
const size = { width: 300, height: 160 };

test('opens below the mention when there is room', () => {
	expect(placePopover({ top: 300, bottom: 320, left: 40 }, size, viewport)).toEqual({ top: 326, left: 40 });
});

test('opens above the mention when there is no room below', () => {
	// The reviewer's case: a mention at y=691 on an 844px screen.
	expect(placePopover({ top: 691, bottom: 711, left: 40 }, size, viewport)).toEqual({ top: 691 - 6 - 160, left: 40 });
});

test('stays inside the screen horizontally', () => {
	expect(placePopover({ top: 300, bottom: 320, left: 250 }, size, viewport).left).toBe(390 - 300 - 8);
	expect(placePopover({ top: 300, bottom: 320, left: -20 }, size, viewport).left).toBe(8);
});
