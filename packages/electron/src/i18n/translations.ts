export type Language = 'en' | 'zh';

export interface Translations {
  settings: {
    title: string;
    subtitle: string;
    tabs: {
      ai: string;
      api: string;
      database: string;
      editor: string;
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
    };
    api: {
      title: string;
      description: string;
      localStorage: string;
      providerCount: string;
    };
    database: {
      title: string;
      connected: string;
      host: string;
      database: string;
      status: string;
    };
    editor: {
      title: string;
      fontSize: string;
      tabSize: string;
      spaces2: string;
      spaces4: string;
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
    settings: string;
    refresh: string;
    login: string;
    logout: string;
  };
  sidebar: {
    projects: string;
    newProject: string;
    deleteProject: string;
    noProjects: string;
  };
  chat: {
    placeholder: string;
    send: string;
  };
  welcome: {
    title: string;
    loggedIn: string;
    loggedOut: string;
    connected: string;
    aiReady: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    settings: {
      title: 'Settings',
      subtitle: 'Configure your AI IDE',
      tabs: {
        ai: 'AI Providers',
        api: 'API Keys',
        database: 'Database',
        editor: 'Editor',
        language: 'Language',
      },
      ai: {
        providers: 'AI Providers',
        addProvider: 'Add Provider',
        models: 'Models',
        addModel: 'Add Model',
        providerName: 'Provider Name',
        apiEndpoint: 'API Endpoint',
        apiKey: 'API Key',
        modelName: 'Model Display Name',
        modelId: 'Model ID (e.g., gpt-4o)',
        noModels: 'No models configured. Click "Add Model" to add one.',
        selectProvider: 'Select a provider to configure',
      },
      api: {
        title: 'API Keys',
        description: 'Configure API keys in the AI Providers tab above. Keys are stored locally.',
        localStorage: 'Local Storage',
        providerCount: 'provider(s), keys stored in browser localStorage',
      },
      database: {
        title: 'Database Connection',
        connected: 'Connected',
        host: 'Host: localhost:5432',
        database: 'Database: webaiide',
        status: 'Status: Ready',
      },
      editor: {
        title: 'Editor Settings',
        fontSize: 'Font Size',
        tabSize: 'Tab Size',
        spaces2: '2 spaces',
        spaces4: '4 spaces',
      },
      language: {
        title: 'Language Settings',
        description: 'Choose your preferred language for the interface.',
        selectLanguage: 'Select Language',
        english: 'English',
        chinese: '中文 (Chinese)',
      },
      actions: {
        save: 'Save Changes',
        cancel: 'Cancel',
        saved: 'Settings saved',
      },
    },
    login: {
      title: 'Sign In',
      name: 'Name',
      email: 'Email',
      password: 'Password',
      login: 'Sign In',
      register: 'Create Account',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      emailRequired: 'Email is required',
      passwordRequired: 'Password is required',
      loginSuccess: 'Login successful',
      registerSuccess: 'Registration successful',
      loading: 'Please wait...',
      passwordRequirementsNotMet: 'Please meet all password requirements',
      namePlaceholder: 'Your name',
      passwordStrength: {
        weak: 'Weak',
        fair: 'Fair',
        good: 'Good',
        strong: 'Strong',
      },
      passwordRequirements: {
        length: 'At least 8 characters',
        uppercase: 'At least 1 uppercase letter',
        lowercase: 'At least 1 lowercase letter',
        number: 'At least 1 number',
        special: 'At least 1 special character',
      },
    },
    header: {
      settings: 'Settings',
      refresh: 'Refresh',
      login: 'Sign In',
      logout: 'Sign Out',
    },
    sidebar: {
      projects: 'Projects',
      newProject: 'New Project',
      deleteProject: 'Delete Project',
      noProjects: 'No projects yet',
    },
    chat: {
      placeholder: 'Type your message...',
      send: 'Send',
    },
    welcome: {
      title: 'Welcome to Web AI IDE',
      loggedIn: 'Welcome back',
      loggedOut: 'Your intelligent coding companion. Sign in to sync your projects across devices.',
      connected: 'Connected',
      aiReady: 'AI Ready',
    },
  },
  zh: {
    settings: {
      title: '设置',
      subtitle: '配置您的 AI IDE',
      tabs: {
        ai: 'AI 提供商',
        api: 'API 密钥',
        database: '数据库',
        editor: '编辑器',
        language: '语言',
      },
      ai: {
        providers: 'AI 提供商',
        addProvider: '添加提供商',
        models: '模型',
        addModel: '添加模型',
        providerName: '提供商名称',
        apiEndpoint: 'API 端点',
        apiKey: 'API 密钥',
        modelName: '模型显示名称',
        modelId: '模型 ID（例如：gpt-4o）',
        noModels: '尚未配置模型。点击"添加模型"进行添加。',
        selectProvider: '选择一个提供商进行配置',
      },
      api: {
        title: 'API 密钥',
        description: '请在上方的 AI 提供商标签页中配置 API 密钥。密钥存储在本地。',
        localStorage: '本地存储',
        providerCount: '个提供商，密钥存储在浏览器本地存储中',
      },
      database: {
        title: '数据库连接',
        connected: '已连接',
        host: '主机：localhost:5432',
        database: '数据库：webaiide',
        status: '状态：就绪',
      },
      editor: {
        title: '编辑器设置',
        fontSize: '字体大小',
        tabSize: '制表符宽度',
        spaces2: '2 个空格',
        spaces4: '4 个空格',
      },
      language: {
        title: '语言设置',
        description: '选择您喜欢的界面语言。',
        selectLanguage: '选择语言',
        english: 'English (英语)',
        chinese: '中文',
      },
      actions: {
        save: '保存更改',
        cancel: '取消',
        saved: '设置已保存',
      },
    },
    login: {
      title: '登录',
      name: '名字',
      email: '邮箱',
      password: '密码',
      login: '登录',
      register: '注册账号',
      noAccount: '没有账号？',
      hasAccount: '已有账号？',
      emailRequired: '请输入邮箱',
      passwordRequired: '请输入密码',
      loginSuccess: '登录成功',
      registerSuccess: '注册成功',
      loading: '请稍候...',
      passwordRequirementsNotMet: '请满足所有密码要求',
      namePlaceholder: '输入您的名字',
      passwordStrength: {
        weak: '弱',
        fair: '一般',
        good: '良好',
        strong: '强',
      },
      passwordRequirements: {
        length: '至少 8 个字符',
        uppercase: '至少 1 个大写字母',
        lowercase: '至少 1 个小写字母',
        number: '至少 1 个数字',
        special: '至少 1 个特殊字符',
      },
    },
    header: {
      settings: '设置',
      refresh: '刷新',
      login: '登录',
      logout: '退出登录',
    },
    sidebar: {
      projects: '项目',
      newProject: '新建项目',
      deleteProject: '删除项目',
      noProjects: '暂无项目',
    },
    chat: {
      placeholder: '输入消息...',
      send: '发送',
    },
    welcome: {
      title: '欢迎使用 Web AI IDE',
      loggedIn: '欢迎回来',
      loggedOut: '您的智能编程助手。登录以跨设备同步项目。',
      connected: '已连接',
      aiReady: 'AI 就绪',
    },
  },
};

export function getTranslation(lang: Language): Translations {
  return translations[lang];
}
