# 安卓自用版（离线排盘 + 可选 DeepSeek）

应用名称：紫微命盘；应用 ID：`cn.local.ziweichart`；当前版本：1.1，版本号 2；最低系统：Android 7.0（API 24）。需要正常更新的 Android System WebView。原 1.0 离线 APK 保留。

## 功能与范围

- 沿用网页版同一套排盘、时间换日、运限四化和手机布局，不复制另一份算法。
- 页面与算法打包进 APK，安装后无需电脑服务，可断网排盘。
- 出生表单只保留在本次运行内，排盘在手机上完成；主题保存在本机。不含登录、广告或统计。DeepSeek 为可选服务，未配置或未主动发送时不会调用。
- AI 仅发送白名单命盘结构、性别、虚岁、所选运限和问题，不自动附带姓名、出生日期、地点、经度、原始时刻。用户在问题里自行填写的个人资料会随问题发送。
- 返回键可从命盘回到保留输入的表单；支持深浅主题、宫位大字详情和开源许可查看。
- 真太阳时采用现有近似算法；仍按北京时间输入，历史夏令时需用户先确认标准时间。
- 属于个人测试版，不包含应用商店上架、自动更新、账号同步或完整流年十二宫。

## 构建

```powershell
npm ci
npm run mobile:build
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm run mobile:test

# 先安装 JDK 21 和 Android SDK：platforms;android-36、build-tools;36.0.0。
# 使用 SDK 前需由用户同意 Google Android SDK 许可协议。
# 工具可放在 .android-tools/ 下，也可指定环境变量。
$env:ANDROID_SDK_ROOT = 'D:/path/to/android-sdk'
$env:JAVA_HOME = 'D:/path/to/jdk-21'
powershell -NoProfile -File scripts/build-android.ps1
```

当前输出：`outputs/Ziwei-DeepSeek-1.1.apk` 和 SHA-256 校验文件。构建脚本还编译并运行原生 SSE 回归测试。当前构建脚本生成调试签名 APK，适合个人试用；以后覆盖安装须沿用同一签名。正式发布前需配置独立的发布签名。

## 安装

将 APK 传到自己的安卓手机，点击安装；若系统提示，按手机界面为所用文件管理器临时允许安装来源。安装与来源许可由用户在手机上完成。无需安装 Google Play 服务。

网页离线资源测试与原生安装验证不同；APK 构建成功后仍需在实际手机上确认启动、系统返回键和屏幕边缘显示。

## 2026-11-02 原 1.0 离线版验证

- 已在用户确认 Google SDK 许可后完成本机安卓构建，生成 `outputs/Ziwei-Offline-1.0.apk`，4,963,589 字节。
- APK v2 签名验证通过；包名 `cn.local.ziweichart`，最低 API 24，目标 API 36。
- APK 内五个离线资源文件逐一与测试过的构建结果进行 SHA-256 比对，全部一致，Android 字节码存在。
- 最终清单没有 INTERNET 或存储权限；仅保留 AndroidX 为内部接收器声明的应用私有签名权限。
- 两项离线应用浏览器测试、十二项网页版与响应式测试、类型检查和构建均通过。未连接实体安卓手机，因此没有宣称实机安装通过。
- SDK 安装工具已升级为 Android CLI；所需包标识使用 `platforms/android-36`、`build-tools/36.0.0`。AGP 另自动补装 Build-Tools 35 和 Platform-Tools。

## 1.1 DeepSeek 设置与发送范围

1. 覆盖安装新版后，打开顶部“DeepSeek 设置”。在手机中填写自己的 API Key，不必发送给开发者。
2. 默认使用 `deepseek-flash`，可切换 `deepseek-v4-pro`；单次输出上限为 1024 或 2048 tokens。保存配置本身不调用接口。
3. 阅读并勾选资料发送与计费说明，再保存。密钥通过 Android Keystore 中的 AES-256-GCM 密钥加密，密文与随机 IV 保存在应用私有偏好设置；不使用明文回退，读取设置不返回原始密钥，可删除。
4. 起盘后选择主题，点击“开始解读”，或者输入问题后点击“发送追问”。回答流式显示，可停止；不自动重试。切换视图、年份、宫位或配置会取消旧请求并清空对话，避免混用结论。聊天仅保留在本次界面内。

网络请求由原生插件发送，固定为 `https://api.deepseek.com/chat/completions`，不跟随重定向。网页 CSP 仍禁止网络连接，未开放任意代理或自定义地址；APP 增加普通 INTERNET 权限。关闭原生桥日志和 WebView 调试，密钥不打包进 APK。HTTP 401、402、429、超时等只显示固定提示，不回显响应正文或认证头。

接口依据：[DeepSeek 官方 API 文档](https://api-docs.deepseek.com/)、[Chat Completions](https://api-docs.deepseek.com/api/create-chat-completion/)。当前明确关闭 thinking 模式以控制等待与输出；上下文仅保留最近四轮成功问答。命盘提示词要求区分盘面事实、传统解释和不确定性，不编造古籍或倪海厦引文。

验证包括：9 项移动浏览器模拟接口/离线场景、命盘资料隐私及四化回归、3 项原生 SSE 解析测试、类型检查与生产构建。模拟调用不使用真实密钥、不产生 API 费用；尚未在实体手机或真实 DeepSeek 账户上验证加密存储与联网调用。

交付已核对：1.1 使用与 1.0 相同的签名证书，应用 ID 不变，版本号升为 2，可覆盖安装。最终 APK 的 v2 签名、最低系统和权限清单已验证；打包资源与测试过的构建结果逐项一致，桥日志和 WebView 调试均关闭。详细哈希和验证结果见 `outputs/DeepSeek-1.1-verification.json`。
