/**
 * Canonical input action names.
 * Core defines the contract: scripting and engine ask for these semantic names.
 * input-mappings-v2 implements the mapping (raw keys/sticks → actions).
 *
 * Scripts use getAction("jump"), not isKeyPressed("space").
 */

const _list = [
  'moveForward',
  'moveBackward',
  'moveLeft',
  'moveRight',
  'jump',
  'lookHorizontal',
  'lookVertical',
  'sprint',
  'flyDown',
] as const;

export type InputActionName = (typeof _list)[number];

/** All action names for iteration. */
export const INPUT_ACTION_NAMES_LIST: readonly InputActionName[] = _list;

/** Enum-like object for INPUT_ACTION_NAMES.moveForward etc. */
export const INPUT_ACTION_NAMES = Object.fromEntries(
  _list.map((n) => [n, n]),
) as Record<InputActionName, InputActionName>;

const _set = new Set<string>(_list);

/** Type guard: true if x is a valid action name. */
export function isInputActionName(x: string): x is InputActionName {
  return _set.has(x);
}
