# 部署方案研究

## 现状

- 域名 `ifix.xin` 解析到 `198.18.3.155`
- 当前 NS 服务器为万网：`dns31.hichina.com`、`dns32.hichina.com`
- GitHub CLI 已登录账户：`holdonyb`
- 项目已完成 `npm run build`，产物在 `dist/`

## 推荐方案：GitHub Pages + 万网 CNAME

最简单、免费、自带 HTTPS 证书，手机和电脑均可直接访问。

### 1. 仓库规划

| 项目 | 建议 |
|------|------|
| GitHub 仓库 | `holdonyb/poe2vania` |
| 公开/私有 | 公开（GitHub Pages 对公开仓库免费） |
| 默认分支 | `main` |
| 构建产物 | `dist/` 推送到 `gh-pages` 分支，或用 GitHub Actions 自动构建 |

### 2. GitHub Pages 配置

方式 A（手动）：把 `dist/` 内容推到 `gh-pages` 分支，在仓库设置里启用 Pages。  
方式 B（自动）：用 GitHub Actions 在每次 push 到 main 时自动 `npm ci && npm run build` 并部署到 Pages。

推荐 **方式 B**，后续改代码自动上线。

### 3. 自定义域名绑定

在仓库根目录放 `CNAME` 文件，内容为：

```
xxx.ifix.xin
```

（`xxx` 由你指定，例如 `game`、`poe2vania`、`exile` 等）

### 4. 万网 DNS 配置

登录阿里云/万网域名控制台，给 `ifix.xin` 添加解析：

| 主机记录 | 记录类型 | 解析线路 | 记录值 |
|----------|----------|----------|--------|
| xxx | CNAME | 默认 | holdonyb.github.io |

TTL 默认 10 分钟。生效后访问 `https://xxx.ifix.xin` 即可。

### 5. HTTPS

GitHub Pages 自动申请 Let's Encrypt 证书，无需额外操作。

## 备选方案

### 方案二：Cloudflare Pages

优点：全球 CDN、国内访问比 GitHub Pages 稳定。  
缺点：需要把 `ifix.xin` 的 NS 改为 Cloudflare，迁移 DNS 记录。

### 方案三：自有服务器（openai-api）

如果 `openai-api.ifix.xin` 是你已有的服务器，可把 `dist/` 通过 scp/rsync 上传到服务器 Nginx/Apache 目录。  
当前 SSH 直连失败，需要你给我密钥或登录方式。

## 需要你确认/授权的事项

1. **子域名**：具体想用 `xxx.ifix.xin` 里的什么？推荐 `game.ifix.xin` 或 `poe2vania.ifix.xin`。
2. **GitHub 仓库**：是否同意我直接创建 `holdonyb/poe2vania` 公开仓库并推送代码？
3. **DNS 配置方式**：
   - A. 我给你万网 DNS 配置截图/步骤，你自己添加 CNAME；
   - B. 你给我阿里云/万网临时登录权限，我帮你添加；
   - C. 把域名 NS 迁到 Cloudflare，我接管全部 DNS。
4. **游戏名称**：目前叫 `POE2vania / 流放恶魔城`，是否需要改？

## 我接下来要做的事（等你确认后）

- [ ] 创建 GitHub 仓库并推送代码
- [ ] 配置 GitHub Actions 自动部署
- [ ] 添加 `CNAME` 文件
- [ ] 协助/执行 DNS 配置
- [ ] 验证 `https://xxx.ifix.xin` 可访问
