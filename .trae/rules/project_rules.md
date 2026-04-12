# 项目级规则
- 使用中文回答所有问题

## 不修改的目录

- `packages/openclaude-temp` - 外部依赖的 AI Agent 引擎，禁止修改
  - 该包是独立的开源项目 (openclaude)
  - 仅使用其提供的 gRPC 接口进行集成

## i18n 国际化规则

### 基本原则
- 所有用户可见的文本必须使用 i18n 翻译，禁止硬编码文本
- 新增功能时必须同步添加中英文翻译
- 使用 `translations.ts` 中定义的翻译键，通过 `t` 对象访问

### 翻译文件位置
- 主翻译文件：`packages/electron/src/i18n/translations.ts`
- 翻译对象通过 `useSettings()` hook 获取：`const { t } = useSettings()`

### 使用规范
1. **组件中使用**:
   ```tsx
   const { t } = useSettings();
   // 使用示例
   <h1>{t.settings.title}</h1>
   ```

2. **翻译键命名**:
   - 使用层级结构：`category.subcategory.item`
   - 使用英文小写，单词间用下划线分隔
   - 语义清晰，便于理解

3. **新增翻译**:
   - 在 `Translations` 接口中添加类型定义
   - 在 `translations` 对象中添加中英文翻译
   - 确保中英文语义一致

4. **禁止行为**:
   - ❌ 禁止在组件中硬编码用户可见文本
   - ❌ 禁止跳过翻译文件直接修改文本
   - ✅ 必须同时更新中英文翻译

### 示例
```tsx
// ❌ 错误：硬编码文本
<h4>需要登录</h4>
<p>AI 设置需要登录后才能配置</p>

// ✅ 正确：使用 i18n
<h4>{t.settings.ai.loginRequiredTitle}</h4>
<p>{t.settings.ai.loginRequiredMessage}</p>
```