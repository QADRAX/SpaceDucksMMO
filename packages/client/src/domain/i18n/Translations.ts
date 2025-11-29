// Domain: Translation keys type-safe structure
// This will be the shape of your translation files

export interface Translations {
  // Common UI
  common: {
    ok: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    close: string;
    back: string;
    next: string;
    loading: string;
    error: string;
  };

  // Lobby screen
  lobby: {
    play: string;
    settings: string;
    quit: string;
    sandbox: string;
  };

  // Sandbox screen
  sandbox: {
    backToMenu: string;
  };

  // Scene Editor
  editor: {
    sceneHierarchy: {
      title: string;
      objectCount: string;
      empty: string;
      addObjects: string;
      deleteConfirm: string;
      cannotDeleteCamera: string;
    };
    objectInspector: {
      title: string;
      noSelection: string;
      selectFromHierarchy: string;
      transform: string;
      properties: string;
      position: string;
      rotation: string;
      scale: string;
    };
    camera: {
      modes: {
        orbit: string;
        fixed: string;
      };
      orbitTarget: string;
      manualPosition: string;
    };
    addObject: {
      title: string;
      categories: {
        visual: string;
        lights: string;
        helpers: string;
        cameras: string;
      };
    };
  };

  // Settings popup
  settings: {
    title: string;
    saveChanges: string;
    graphics: {
      title: string;
      quality: string;
      antialiasing: string;
      shadows: string;
      qualityLow: string;
      qualityMedium: string;
      qualityHigh: string;
    };
    audio: {
      title: string;
      masterVolume: string;
      music: string;
      soundEffects: string;
    };
    gameplay: {
      title: string;
      mouseSensitivity: string;
      language: string;
    };
  };

  // Server selector
  servers: {
    title: string;
    noServers: string;
    addServerHint: string;
    connect: string;
    remove: string;
    addNewServer: string;
    serverName: string;
    serverUrl: string;
    region: string;
    regionOptional: string;
  };
}

export type TranslationKey = string;
