---
name: 日期时间处理使用 dayjs
description: 项目中所有日期/时间/时长格式化统一使用 dayjs，禁止手写 new Date() + padStart 拼接
type: feedback
---

所有日期、时间、时长格式化统一使用 dayjs，禁止手写 `new Date()` + `getFullYear()` + `padStart` 拼接。

**Why:** 2026-05-25 用户明确要求将手动日期格式化改为 dayjs 实现，并沉淀为项目习惯。dayjs 体积小巧、API 统一、可扩展性强，避免手写格式化代码的重复和错误。

**How to apply:**
- 日期格式化：`dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')`
- 时长格式化（视频时长等）：`dayjs.extend(duration)` 后使用 `dayjs.duration(seconds, 'seconds')`
- 项目中已安装 dayjs 依赖，duration 插件按需 extend
- 遇到任何日期/时间处理场景，优先使用 dayjs 而非原生 Date API
