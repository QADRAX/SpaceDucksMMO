export * from './types';
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
