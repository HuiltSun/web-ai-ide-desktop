export type Language = 'en' | 'zh';

export interface Translations {
  settings: {
    title: string;
    subtitle: string;
    tabs: {
      ai: string;
      database: string;
      editor: string;
      appearance: string;
      language: string;
    };
    ai: {
      providers: string;
      addProvider: string;
      models: string;
      addModel: string;
      providerName: string;
      apiEndpoint: string;
      apiKey: string;
      modelName: string;
      modelId: string;
      noModels: string;
      selectProvider: string;
      loginRequiredTitle: string;
      loginRequiredMessage: string;
    };
    database: {
      title: string;
      connected: string;
      host: string;
      database: string;
      status: string;
      loginRequiredMessage: string;
    };
    editor: {
      title: string;
      fontSize: string;
      tabSize: string;
      spaces2: string;
      spaces4: string;
    };
    appearance?: {
      uiStyleTitle: string;
      uiStyleDescription: string;
      iosStyle: string;
      iosStyleDesc: string;
      legacyStyle: string;
      legacyStyleDesc: string;
      colorModeTitle: string;
      colorModeDescription: string;
      light: string;
      dark: string;
      system: string;
    };
    language: {
      title: string;
      description: string;
      selectLanguage: string;
      english: string;
      chinese: string;
    };
    actions: {
      save: string;
      cancel: string;
      saved: string;
    };
  };
  login: {
    title: string;
    name: string;
    email: string;
    password: string;
    login: string;
    register: string;
    noAccount: string;
    hasAccount: string;
    emailRequired: string;
    passwordRequired: string;
    loginSuccess: string;
    registerSuccess: string;
    loading: string;
    passwordRequirementsNotMet: string;
    namePlaceholder: string;
    passwordStrength: {
      weak: string;
      fair: string;
      good: string;
      strong: string;
    };
    passwordRequirements: {
      length: string;
      uppercase: string;
      lowercase: string;
      number: string;
      special: string;
    };
  };
  header: {
    appName: string;
    projectActive: string;
    noProject: string;
    settings: string;
    refresh: string;
    login: string;
    logout: string;
    signedInAs: string;
  };
  sidebar: {
    projects: string;
    newProject: string;
    deleteProject: string;
    noProjects: string;
    createOneToStart: string;
    projectName: string;
    create: string;
    cancel: string;
    confirmDeleteProject: string;
  };
  chat: {
    placeholder: string;
    send: string;
    messagePlaceholder: string;
    pressEnter: string;
    aiAssistant: string;
    askMeAnything: string;
    writeCode: string;
    debugErrors: string;
    explainLogic: string;
    thinking: string;
    generating: string;
    disconnected: string;
  };
  welcome: {
    title: string;
    loggedIn: string;
    loggedOut: string;
    connected: string;
    aiReady: string;
    selectOrCreate: string;
    loading: string;
  };
  menu: {
    file: string;
    newProject: string;
    openProject: string;
    save: string;
    saveAs: string;
    exit: string;
    edit: string;
    undo: string;
    redo: string;
    cut: string;
    copy: string;
    paste: string;
    selectAll: string;
    view: string;
    reload: string;
    toggleDeveloperTools: string;
    toggleFullScreen: string;
    window: string;
    minimize: string;
    maximize: string;
    close: string;
    help: string;
    documentation: string;
    about: string;
  };
}
