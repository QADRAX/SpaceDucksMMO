export * from './types';
export { detectHooksFromSource, ALL_HOOKS } from './detectHooks';
export {
	createScriptSlot,
	slotKey,
	initScriptSlot,
	destroyScriptSlot,
	destroyEntityScriptSlots,
	runHookOnAllSlots,
	syncSlotPropertiesFromScene,
	flushDirtySlotsToScene,
} from './slots';
export { syncSiblingPropertyToSlot } from './syncSiblingProperty';
