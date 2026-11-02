# 安卓个人测试版 1.2：离线排盘与倪师课程依据

应用 ID：`cn.local.ziweichart`；版本 1.2（versionCode 3）；Android 7.0 及以上，需正常更新的 Android System WebView。调试签名的个人测试构建，与此前 1.0/1.1 沿用同一签名，可覆盖安装并保留已保存的 Key；不含自动更新。自行构建默认使用自己的调试证书，不能直接覆盖本 Release。

## 当前规则与范围

采用 `ni-tianji-v1`：午夜换日、闰月整月归下月、固定生年四化；辛年魁午钺寅；按所选年份定位十年大限和男顺女逆小流年。本命和大限看三方四正，小流年突出本宫及对宫。不含宫干飞化、流年年干追加四化、流月流日或阳宅面相。

出生日期按公历、北京时间标准时间填写，课程农历案例须先换算为公历；历史夏令时请先确认标准时间。真太阳时默认关闭，可在选好出生地后自行勾选，采用近似算法；本次未找到“倪师必用真太阳时”的充分直接依据。未知时辰仅按子时试排并明确提示。闰月三十归入仅有二十九天的下月时，会提示暂不能排盘，不静默改日。

完整出处、课程案例断言范围及未核验项目见 [教学核对记录](ni-school-audit.md)。不是课程全部内容的复刻，也不保证预测准确。

## 安装与 DeepSeek

1. 下载 Release 中的 `Ziwei-DeepSeek-1.2.apk`。可直接覆盖此前版本；手机上的安装来源许可由用户自行操作。
2. 打开“DeepSeek 设置”，自己在手机填写 Key，选择模型与输出长度，阅读并勾选资料发送与计费说明后保存。保存不发起 API 调用。
3. 起盘、选择主题或宫位后点击“开始解读”；支持流式回答、追问、停止。切换年份、视图、宫位或设置会取消旧请求并清空对话，避免混盘；不自动重试。
4. 每次只从离线课程库中检索最多 8 条依据发给模型。回答应带教学编号，展开“本次教学依据”可看原文及视频出处。没有引用或引用未提供编号时会提示，不将该回答作为成功历史继续传入。编号检查不保证推理正确。

页面与算法打包在 APK 中，排盘可离线；DeepSeek 需要联网并按用户账户用量计费。默认模型 `deepseek-flash`，可选 `deepseek-v4-pro`，按当前原生适配实现调用。

## 隐私与实现

Key 用 Android Keystore 中的 AES-256-GCM 密钥加密，密文和随机 IV 保存在应用私有偏好设置，没有明文回退，也不会返回网页层。可以删除 Key；关闭系统备份、桥日志、WebView 调试及明文网络。APK 不内置真实 Key，无广告、登录或统计。

网络由原生插件发送到固定地址 `https://api.deepseek.com/chat/completions`，拒绝重定向，正常验证 TLS。网页 CSP 仍为 `connect-src 'none'`，浏览器预览不能配置安卓密钥。只有普通 INTERNET 权限和 AndroidX 私有接收器权限，没有存储权限。

发送白名单命盘结构、性别、虚岁、所选行限、问题和本次公共教学短引文，不自动附带姓名、出生日期、地点、经度或原始时间。自己写进问题的资料仍会被发送。聊天只保留在当前界面，成功历史最多四轮；失效请求和未通过编号检查的回答不进入成功历史。

## 构建与测试

```powershell
npm ci
npm run typecheck
npm test
npm run test:ni
npm run test:ai
npm run build
npx playwright install chromium
npm run test:e2e
npm run mobile:build
npm run mobile:test

# 先自行接受 Google SDK 许可并安装 JDK 21 / SDK Platform 36 / Build-Tools 36。
$env:ANDROID_SDK_ROOT = 'D:/path/to/android-sdk'
$env:JAVA_HOME = 'D:/path/to/jdk-21'
npm run android:build
```

Windows 可用已安装 Edge：设置 `$env:PLAYWRIGHT_CHANNEL = 'msedge'`。构建脚本输出 APK 与 SHA-256，并编译、运行 3 项原生 SSE 解析测试。SDK/JDK、缓存、`.env`、私钥和本机配置不提交。

浏览器测试覆盖规则边界、课程例盘界面、不同屏宽和 11 项离线／模拟 AI 场景。**尚未使用真实 DeepSeek Key 调用，尚未在实体手机验证**；浏览器测试及 APK 签名校验不等于实机验收。最终 APK 的哈希、签名和资源核对结果随 Release 附件提供。

## 来源与许可

代码来自 Renhuai123/ziwei-doushu，保留 MIT 原版权。课程短引文来自上游 docs/tianji-ziwei 与 Renhuai123/nihai-tianji-corpus（462faa4），新增去重索引、条件检索和引用编号；语料及衍生索引按 CC BY-NC-SA 4.0 处理，课程著作权归原权利人。**含该语料的 APK 仅供非商业学习研究**。APP“关于 → 查看开源许可”保留完整声明。

[全部来源说明](../ATTRIBUTION.md)。1.1 历史构建说明保存在 [原标签](https://github.com/gaojing-ops/ziwei-doushu/blob/android-v1.1/docs/android-app.md)。
