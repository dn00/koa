/**
 * Services barrel export.
 */

export {
	saveEvents,
	loadEvents,
	clearEvents,
	createAutoSave,
	STORAGE_KEY,
	type V5Event
} from './persistence';

export {
	loadPack,
	getPuzzle,
	listPacks,
	getPackMetadata,
	BUILTIN_PACK_ID
} from './packLoader';

export {
	registerServiceWorker,
	isServiceWorkerSupported,
	checkForUpdate,
	createUpdateNotifier,
	getInstallPrompt,
	setupInstallPromptListener,
	triggerInstallPrompt,
	isAppInstalled,
	createOnlineTracker,
	type PWAState,
	type SWRegistration,
	type InstallPromptHandler,
	type UpdateNotifier,
	type BeforeInstallPromptEvent
} from './pwa';
