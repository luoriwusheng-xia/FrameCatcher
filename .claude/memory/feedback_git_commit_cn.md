---
name: Git commit 中文规范
description: 用户使用中文撰写 git commit，并严格遵循 git-cz 规范
type: feedback
---

所有 git commit message 必须使用中文撰写，并严格遵循 git-cz 规范。

**格式：** `<type>(<scope>): <subject>`

**type 类型：**
- `feat`: 新功能
- `fix`: 修复问题
- `docs`: 文档变更
- `style`: 代码格式调整（不影响运行）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具/依赖变更

**Why:** 用户明确要求使用中文并遵循 git-cz 规范，以保证提交历史的可读性和一致性。
**How to apply:** 每次执行 git commit 时，用中文撰写符合 git-cz 格式的提交信息，type 和 scope 保持英文，subject 使用中文。
