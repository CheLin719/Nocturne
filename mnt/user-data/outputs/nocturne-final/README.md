# Nocturne — 启动说明

## 文件结构

```
nocturne-site/
├── index.html        ← 主页面（在浏览器打开这个）
├── style.css         ← 样式
├── script.js         ← 前端逻辑
├── data.js           ← ⭐ 你的内容（世界观、角色、音乐）
├── server.js         ← 后端服务器
├── package.json      ← Node 依赖配置
├── .env.example      ← 环境变量示例（复制改名用）
├── .env              ← 你的真实配置（不要上传！）
├── .gitignore        ← 防止 .env 被上传
└── images/           ← 你的图片文件夹
```

---

## 第一次启动（只需做一次）

### 第一步：安装 Node.js
去 https://nodejs.org 下载安装（选 LTS 版本）

### 第二步：安装依赖
打开终端，进入项目文件夹，运行：
```bash
npm install
```

### 第三步：配置 API Key
1. 去 https://aistudio.google.com/app/apikey 获取 Gemini API Key（免费）
2. 把 `.env.example` 复制一份，改名为 `.env`
3. 打开 `.env`，把 `在这里填你的key` 换成你的真实 Key

---

## 每次启动

### 启动后端服务器
```bash
node server.js
```
看到 `✅ Nocturne 后端已启动：http://localhost:3000` 就成功了

### 打开前端页面
直接双击 `index.html` 在浏览器打开，或者：
```
http://localhost:3000/index.html
```

---

## 部署到云端（让别人也能访问）

推荐用 **Railway**（免费，简单）：

1. 去 https://railway.app 注册
2. New Project → Deploy from GitHub repo
3. 把项目上传到 GitHub（记得 `.env` 不会被上传，`.gitignore` 会阻止）
4. 在 Railway 的 Variables 里手动添加：
   - `GEMINI_API_KEY` = 你的key
   - `GEMINI_MODEL` = gemini-1.5-flash
5. 部署成功后，Railway 会给你一个地址，如 `https://nocturne-xxx.railway.app`
6. 打开 `script.js`，把这一行：
   ```js
   const BACKEND = 'http://localhost:3000';
   ```
   改成：
   ```js
   const BACKEND = 'https://nocturne-xxx.railway.app';
   ```

---

## 常见问题

**Q：页面打开但发消息没反应？**
A：检查后端有没有在跑（终端里有没有看到启动信息）

**Q：报错 "无法连接后端服务器"？**
A：确认终端里已经运行了 `node server.js`

**Q：报错 "未配置 GEMINI_API_KEY"？**
A：检查 `.env` 文件是否存在且格式正确（不是 `.env.example`）

**Q：想在开发时自动重启服务器（改代码后不用手动重启）？**
A：先运行 `npm install`，然后用 `npm run dev` 代替 `node server.js`
