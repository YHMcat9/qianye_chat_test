# Sprout 外壳 · 部署说明

把 Figma 原型和 Chiba 聊天装进一个可安装的 Web App。原型跑在 iframe 里，聊天以上滑面板盖上来——面板打开时原型从未卸载，关掉后仍停在你离开的那一屏。

## 文件

| 文件 | 作用 |
|---|---|
| `app.html` | 外壳本体，所有 CSS/JS 都在里面 |
| `manifest.json` | 让它能被"安装" |
| `sw.js` | Service Worker，负责可安装性与静态资源缓存 |
| `icon-192.png` / `icon-512.png` / `icon-maskable-512.png` | 主屏图标（占位，可换成 Chiba） |

## 五步部署

**1. 放进现有仓库**

全部丢到 `qianye_chat_test` 仓库根目录，**和 `chat.html` 同级**。

不要改名成 `index.html`——你现在 Figma 里那个跳转链接可能还指着旧入口，`app.html` 不会破坏它。同级还有两个好处：`CHAT_URL` 可以用相对路径（同源，无跨域限制），Service Worker 的作用域也能同时覆盖外壳和聊天页。

**2. 关掉 Figma 里的手机框**

选中原型的起始画板 → 右侧 **Prototype** 面板 → **Device** 改成 **None**。

这一步是必须的。外壳在桌面端会自己画一个细边框手机（393px 宽、34px 圆角、浅灰底），在手机端则铺满全屏。Figma 自带的设备外壳在手机上会变成"手机里画一个手机"，内容被压到只剩一半。

**3. 拿到演示模式链接**

按 Present（▶）进入演示，再 Share → Copy link。链接里必须有 `starting-point-node-id`。同一个对话框把访问权限设成 **Anyone with the link**。

**4. 填进配置（已完成）**

`CONFIG.FIGMA_PROTO_URL` 已经填好你的原型链接（起始画板 `1:933`）。换原型或改起始屏时回来更新这一行即可，代码会自动转成 `embed.figma.com` 地址并补上参数。

**5. 推上去，装到手机**

推到 GitHub，等 Pages 部署完，访问：

```
https://yhmcat9.github.io/qianye_chat_test/app.html
```

- **Android Chrome**：菜单里选「安装应用」，或等它自己弹提示
- **iOS Safari**：分享 → 添加到主屏幕

## 手机端调试

**没有打包这一步。** 改完推上去，手机上下拉刷新就是新版本，一轮一分钟。

调试期间**先在浏览器标签页里测，最后再添加到主屏幕**。主屏实例的缓存更顽固，边改边测容易看到旧版本。

三种看日志的方式，按方便程度：

1. **桌面 DevTools 的设备模拟**（Chrome F12 → 手机图标 → 自定义 393 × 852）。抓得住绝大多数布局问题。
2. **Android + USB**：手机开启 USB 调试，电脑访问 `chrome://inspect#devices`，可以拿到手机上那个页面的完整 DevTools。
3. **手机上的屏幕控制台**：地址后面加 `?debug=1`，例如 `app.html?debug=1`，页面右下角会出现一个可展开的控制台。iOS 上没有 Mac 时这是唯一选择。

只有这几件事在桌面上测不出来，必须真机走一遍：iOS 添加到主屏后的独立模式（跨域 iframe 的 cookie 行为和 Safari 标签页不同）、底部安全区、Chiba 按钮和原型标签栏的位置冲突。

## 三个可能要调的参数

**`FRAME_W` / `FRAME_H`（已设为 402 / 874）** — 你的 Figma 画板尺寸。外壳按这个比例锁定容器，Figma 才能把整屏完整渲染出来。**填错的后果是每一屏底部被裁掉**——正好是导航栏所在的位置。换画板尺寸时必须同步改这里。

**`FAB_BOTTOM`（默认 104）** — Chiba 按钮离底边的高度，单位是**原型像素**，会随画框缩放，所以在任何窗口尺寸下都保持在标签栏上方。你的标签栏约 83px 高。

**`SCALING`（默认 `scale-down-width`）** — 因为容器比例已经和画板一致，这个值现在会完整渲染整屏。一般不需要动。

## 让原型里的 AI 按钮直接唤起聊天

外壳的悬浮按钮永远可用，这一节是可选的升级：点原型里原本那个 AI 图标，直接滑出 Chiba。

原理是 Figma 的 Embed API——原型跳到某一屏时会向外壳发事件，外壳收到就开面板，同时让原型悄悄退回上一屏，所以你关掉聊天时人还在原来的位置。

**一次性配置（约十分钟）：**

1. 去 `figma.com/developers/apps` → Create a new app，填名字，创建后复制 **Client ID**。
2. 点开这个 app → **Embed API** → **Add an embed origin**，填 `https://yhmcat9.github.io`。
3. 把 Client ID 填进 `CONFIG.FIGMA_CLIENT_ID`。
4. 在 Figma 里新建一个空画板（比如命名 `AI Hook`），把原型里 AI 按钮的交互改成 Navigate to → 这个画板。
5. 设 `CONFIG.DEBUG = true`，打开外壳走一遍，控制台会打印每一屏的 node id。点一次 AI 按钮，把打印出来的那个 id 填进 `CONFIG.AI_HOOK_NODE_IDS`，例如 `["128:4102"]`。
6. 确认好用之后，把 `FAB_MODE` 改成 `"fallback"`——在 Embed API 能工作的设备上悬浮按钮会自动隐藏，在不能工作的设备上它仍然留着。

**限制**：Embed API 只对**已登录 Figma 的浏览器**触发。你自己的演示设备登录一次即可；展览时如果观众用自己的手机扫码打开，事件不会触发，这就是为什么悬浮按钮必须保留。

## 打包成 APK

答辩要求以可安装 app 形式演示时走这条。整个过程**不需要本地装 Android Studio**，PWABuilder 在云端用 Google 的 Bubblewrap 出包，能直接给你签好名的 APK。

**先做数字资产链接，否则 app 里会挂着浏览器地址栏。** 这是最容易翻车的一步：

1. 新建一个名为 `yhmcat9.github.io` 的仓库（如果还没有），开启 Pages。
2. 仓库根目录放一个**空文件 `.nojekyll`**。没有它，GitHub Pages 会用 Jekyll 处理站点，而 Jekyll 默认忽略所有以点开头的目录——`.well-known` 会直接 404，验证必然失败。
3. 根目录建 `.well-known/assetlinks.json`：

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "io.github.yhmcat9.sprout",
    "sha256_cert_fingerprints": ["把签名指纹填这里"]
  }
}]
```

指纹和包名在下一步的下载包里，PWABuilder 会一并给你。

**然后出包：**

1. 打开 `pwabuilder.com`，输入 `https://yhmcat9.github.io/qianye_chat_test/app.html`
2. 选 Android → Android Options
3. Package ID 填 `io.github.yhmcat9.sprout`，Signing key 选 **New**（让它生成并签名，签名文件会在下载包里，**务必留好**）
4. 下载，回上一步把指纹填进 `assetlinks.json` 并推上去
5. 把 zip 里的 `.apk` 传到手机安装（需要允许"安装未知来源应用"）

装完是独立图标、无地址栏、无浏览器 UI。zip 里同时有 `.aab`，那是上架 Google Play 用的，答辩用不到。

**iOS 没有等价路径。** 打 ipa 需要 Mac 加每年 99 美元的开发者账号。iPhone 上「添加到主屏幕」就是它的可安装形态，答辩时如实说明即可。

**如果地址栏怎么都去不掉**，改用 Capacitor 打一个纯 WebView 包——它不做域名验证，所以不存在这个失败模式，代价是需要 Android Studio 或一条 GitHub Actions 流水线来构建。这是备选，不是首选。

**演示前必须做的一件事**：现场断网会让 Figma 原型直接加载不出来（它是从 figma.com 流式加载的）。提前录一段完整演示的屏幕录像放在手机里兜底。

## 改完文件记得改这个

`sw.js` 顶部有一行：

```js
const CACHE = "sprout-v4";
```

每次改完 `app.html` 就把它 +1。忘了改的话浏览器会继续拿旧缓存，你会花一晚上调试一个其实已经正确的文件。

## 已知限制

- **必须联网。** Figma 原型是从 figma.com 流式加载的，Service Worker 缓存不了跨域内容。展览现场 WiFi 不稳的话，需要另做一版 PNG 离线播放器。
- **Figma 文件名现在叫 "Untitled"**，它会出现在嵌入地址里。改成 `Sprout` 更体面，但改完链接会变，记得回来更新 `CONFIG`。
