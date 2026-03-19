# Chairpeople

<a href="https://github.com/juggperc/Chairpeople"><img src="public/chairpeople.png" width="128" align="right" /></a>

**[English](./README.md)** | 中文

使用自主智能体构建和管理 AI 驱动的公司。Chairpeople 让您设计公司结构、分配具有独特个性的 AI 员工，并观察他们全天候协作。

## 功能特点

- **公司架构** - 设计您能想象的分层、扁平或任何组织结构
- **自主智能体** - 每个员工都是具有持久记忆和独特个性的 AI 智能体
- **多提供商支持** - 使用 OpenRouter、OpenCode 或自定义提供商的 API 密钥
- **实时交互** - 与个人员工聊天、群聊和智能体之间的私信
- **可执行技能与工具** - 智能体可以在沙盒环境中执行命令
- **技能与连接器** - 智能体可以访问您定义的外部工具和服务
- **持久记忆** - 公司和员工跨会话记住上下文
- **可视化组织** - 交互式组织结构图一目了然
- **动画 UI** - 全程流畅的 Framer Motion 动画

## 技术栈

<div align="left">

![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=FFD43B)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix_UI-161618?style=flat&logo=radix-ui&logoColor=FFD43B)
![Zustand](https://img.shields.io/badge/Zustand-000000?style=flat&logo=zustand&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-FF0055?style=flat&logo=framer&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003545?style=flat&logo=sqlite&logoColor=FFD43B)
![OpenRouter](https://img.shields.io/badge/OpenRouter-FFD700?style=flat&logo=openai&logoColor=black)

</div>

## 架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         Chairpeople                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐         ┌────────────────────────────┐ │
│  │   编排视图        │         │       交互视图              │ │
│  │                  │         │                             │ │
│  │  ┌────────────┐  │         │  ┌────────────┬───────────┐ │ │
│  │  │ 编排器     │──────┐   │  │  公司      │  群聊     │ │ │
│  │  │   智能体   │      │   │  │  │ 流程图    │           │ │ │
│  │  └────────────┘      │   │  │  └────────────┴───────────┘ │ │
│  │                     │   │   │                             │ │
│  │  公司构建器          │   │   │  ┌─────────┐  ┌─────────┐ │ │
│  │  编辑器             │   │   │  │员工详情 │  │ 私信    │ │ │
│  │                     │   │   │  └─────────┘  └─────────┘ │ │
│  └─────────────────────┘   │   └─────────────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐│
│  │                    智能体运行时                              ││
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ ││
│  │  │   记忆       │ │    定时      │ │     技能       │ ││
│  │  │   管理器     │ │    任务      │ │   & 工具       │ ││
│  │  └──────────────┘ └──────────────┘ └──────────────────┘ ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐│
│  │                   SQLite 数据库                               ││
│  │  companies │ employees │ memory │ skills │ connectors │ cron ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## 视图

### 编排视图

通过与编排器智能体对话来设计您的 AI 公司。

```mermaid
graph LR
    A[用户] -->|描述公司| B[编排器]
    B -->|JSON结构| C[公司存储]
    C -->|部门| D[员工]
    C -->|角色| E[汇报线]
    C -->|个性| F[专业领域]
    C -->|技能和工具| G[可执行命令]
```

### 交互视图

监控并与您的 AI 团队协作。

```mermaid
graph TD
    A[公司流程图] --> B[员工节点]
    B --> C[员工详情面板]
    C --> D[个人聊天]
    C --> E[发送私信]
    A --> F[群聊]
    F --> G[所有员工 + CEO]
```

## 开始使用

### 前置要求

- Node.js 18+
- npm 或 pnpm
- OpenRouter、OpenCode 或自定义提供商的 API 密钥

### 安装

```bash
git clone https://github.com/juggperc/Chairpeople.git
cd Chairpeople
npm install
npm run dev
```

### 配置

1. 打开设置面板
2. 选择您的 AI 提供商 (OpenRouter/OpenCode/自定义)
3. 输入您的 API 密钥
4. 选择您的模型
5. 启用网络搜索并配置分块

## 使用方法

### 创建公司

1. 进入**编排**视图
2. 向编排器描述您期望的公司结构
3. 审查生成的结构
4. 点击**创建公司**

示例提示：
- "建立一个扁平化结构的科技初创公司"
- "创建一个有 CEO 和部门传统公司结构"
- "建立一个跨职能团队创意代理机构"

### 与员工互动

1. 进入**交互**视图
2. 点击组织结构图中的任何员工
3. 直接聊天或开始私信
4. 加入群聊观察团队讨论

### 构建技能和工具

让编排器创建带有可执行工具的技能：

- "让所有员工访问中央加密货币钱包"
- "启用销售团队使用我们的 Notion 工作区"
- "创建一个允许员工在沙盒中执行命令的工具"

技能可以包括在沙盒环境中安全执行命令的工具。

### 技能和工具系统

编排器可以构建包含以下内容的技能：

- **可执行工具** - 在沙盒中运行的命令
- **参数定义** - 工具的类型化输入
- **描述** - 何时以及如何使用每个工具

示例技能结构：
```json
{
  "name": "crypto_wallet",
  "description": "访问公司加密货币钱包",
  "tools": [
    {
      "name": "get_balance",
      "description": "获取钱包余额",
      "parameters": {
        "address": { "type": "string", "description": "钱包地址", "required": true }
      }
    }
  ]
}
```

## 项目结构

```
chairpeople/
├── src/
│   ├── components/
│   │   ├── ai/           # 聊天组件
│   │   ├── ui/           # Radix UI 原语
│   │   ├── orchestration/ # 公司构建器
│   │   ├── interaction/  # 流程图、聊天视图
│   │   └── layout/      # 侧边栏、标题
│   ├── lib/
│   │   ├── ai/           # AI 提供商和智能体
│   │   ├── db/           # SQLite 模式
│   │   ├── memory/       # 分块记忆
│   │   ├── skills/       # 技能注册表
│   │   ├── tools/        # 工具注册表和沙盒
│   │   └── cron/         # 任务调度器
│   ├── stores/           # Zustand 状态
│   └── types/            # TypeScript 类型
└── public/
    └── chairpeople.png   # 应用标志
```

## 许可证

MIT

## 贡献

欢迎贡献！请提交 issue 或 PR。
