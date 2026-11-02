# 紫微命盘 · Android 离线排盘与 DeepSeek 解读

[![CI](https://github.com/gaojing-ops/ziwei-doushu/actions/workflows/ci.yml/badge.svg?branch=android-app)](https://github.com/gaojing-ops/ziwei-doushu/actions/workflows/ci.yml)
[![Code: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)

基于 **[Renhuai123/ziwei-doushu](https://github.com/Renhuai123/ziwei-doushu)** 的非官方个人测试版，由 [gaojing-ops](https://github.com/gaojing-ops) 发布。原作者标注为**王多鱼AI**，原代码版权为 **2026 紫微研究**。保留上游 Git 历史、版权和 MIT 许可；新增修改的代码沿用 MIT。详细见 [来源与许可](ATTRIBUTION.md)。本版本与上游、OURANIC、课程作者和 DeepSeek 均无官方关联。

**[下载 Android 1.3 APK](https://github.com/gaojing-ops/ziwei-doushu/releases/tag/android-v1.3)** · [安装、隐私与构建说明](docs/android-app.md) · [上游原始说明](README.upstream.md)

## 能做什么

- 离线排盘：页面和算法内置 APK，无需电脑服务；支持深浅主题、宫位大字详情。
- 时间修复：统一预览、直接起盘与分享还原，采用课程的午夜换日、闰月归下月；真太阳时由用户选择，不默认改时。
- 运限切换：固定生年四化，标出所选年份的十年大限及男顺女逆小流年；本命／大限看三方四正，小流年看本宫和对宫。
- 安卓布局：适配 320 像素起的窄屏、横屏与触控操作。
- 规则出处：逐宫可查每颗星的安星及亮度来源，区分教材表格、软件约定、上游参考和资料冲突。
- 可选 DeepSeek 解读：用户自己在手机填 API Key，支持流式回答、追问、停止和固定错误提示。保存设置不发起付费调用，不自动重试。离线检索课程短引文，校验本次教学编号及带归属的直接引文；模型解释始终明确标识。

## 安装与使用

1. 在 [Release](https://github.com/gaojing-ops/ziwei-doushu/releases/tag/android-v1.3) 下载 `Ziwei-DeepSeek-1.3.apk`，适用于 Android 7.0 及以上，需正常更新的 Android System WebView。
2. APK 为调试签名的个人测试构建，与此前交付的 1.0/1.1/1.2 签名相同，可覆盖安装；不含自动更新或应用商店分发。
3. 需要 AI 时，打开“DeepSeek 设置”，填入自己的 Key，阅读并勾选发送及计费说明后保存。起盘后主动点击“开始解读”。排盘本身不需要 Key。

API Key 经 Android Keystore 加密后保存于应用私有存储，不写入源码或 APK，也不提交到项目服务器。仅在用户主动发送时直连 DeepSeek 官方接口，按用户自己的账户计费。自动发送内容为命盘结构、性别、虚岁、所选运限和问题，不自动发送姓名、出生日期、地点、经度或原始时间；手动写入问题的个人资料仍会随问题发送。聊天仅保留于本次界面，切换盘面上下文会清空。

## 范围与偏差

当前采用 [1.3 教材与例盘核对](docs/ni-school-audit-1.3.md)：午夜换日、闰月整月归下月、生年四化固定、辛年天魁午／天钺寅，并用所选年份对应的大限及小流年行宫解读。保留本命宫名，不增加宫干或年干四化。时辰不详仅按子时试排并明确提示。

出生时间仍按北京时间输入，历史夏令时须自行确认标准时间，真太阳时默认关闭。特殊闰月三十保留真实日历生日，安星按下月及原三十日序处理；336 张边界测试覆盖五种五行局。21 种星庙旺表中 239 个无歧义格优先用教材；天机在丑的教材矛盾、截空主副的软件约定、未核实扩展星均明确标注。不是全部课程规则的认证。

AI 从 1815 条去重、排除注明存疑／勘误后的课程短引文中，每次本地检索最多 8 条附上出处，不发送整套语料。编号检查及有限的直接引文检查不能自动证明解释语义正确；AI 推断不是老师原话。本 APK 包含 CC BY-NC-SA 4.0 课程整理材料，**仅供非商业学习研究**；代码本身仍采用 MIT。教材事实转录另有署名，不将整本 PDF 打包。
传统命理内容仅供文化学习与参考，缺乏可靠的科学预测验证。DeepSeek 可能遗漏条件或生成错误解释；回答不代表已核验的古籍、课程引文或专业建议，程序测试通过也不意味着预测准确。

安卓版的 DeepSeek 功能是本次新增的**原生插件**。原有 Next.js 网站后端 `/api/interpret` 等接口仍未包含，浏览器预览不能配置或调用安卓密钥。

## 开发与验证

```sh
npm ci
npm run typecheck
npm test
npm run test:ai
npm run test:ni
npm run build
npx playwright install chromium
npm run test:e2e
npm run mobile:build
npm run mobile:test
```

网页版开发：`npm run dev`；安卓版浏览器预览：先 `npm run mobile:build`，再 `npm run mobile:preview`。安卓构建需要 JDK 21、Android SDK 及用户接受相应 SDK 许可，随后运行 `npm run android:build`；详细环境要求见 [构建说明](docs/android-app.md)。第三方构建默认会使用自己的调试签名，无法覆盖本 Release，除非持有相同签名密钥；签名私钥不公开。

验证覆盖类型检查、生产构建、排盘与时间回归、14 项网页版交互／响应式测试、12 项移动浏览器场景、3 项原生 SSE 解析测试，以及 APK 签名、权限和资源一致性校验，最终结果见 Release 附件。移动场景使用模拟接口；**未使用真实 DeepSeek Key 调用，也未在实体手机验证**。原有 3 个课程案例有限断言保留；新增教材 39 幅例图（38 组不同参考输入）的命宫与 14 主星对照，月份留空者由命宫与生时逆查安星月构造参考输入，不能当作已证实完整生日。完整范围见 [1.3 核对记录](docs/ni-school-audit-1.3.md)。

## 来源与许可

修改起点：[上游提交 495b79e](https://github.com/Renhuai123/ziwei-doushu/commit/495b79ecb3524b20b2edc026067d7d0b0f407319)。发布分支 `android-app` 保留本次测试的源码；`main` 保留 Fork 时的上游版本。

- 代码：[MIT](LICENSE)，保留原版权。
- 上游大型数据集：[DATASET-LICENSE](DATASET-LICENSE)，本 Release 不重新分发，APK 不附带这些数据集。
- 课程短引文整理：[CC BY-NC-SA 4.0](docs/tianji-ziwei/LICENSE.md)，不适用代码的 MIT 许可。
- APK 的“关于 → 查看开源许可”保留原项目及所打包前端依赖的声明。

上游中文 README 完整保存在 [README.upstream.md](README.upstream.md)；其中的线上服务、历史发布及数据集规模为上游信息，并非本 APK 的功能承诺。
