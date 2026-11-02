# 紫微命盘 Android 1.1 · DeepSeek 个人测试版

基于 [Renhuai123/ziwei-doushu](https://github.com/Renhuai123/ziwei-doushu)，原作者标注为王多鱼AI，代码版权为“2026 紫微研究”。这是 gaojing-ops 发布的非官方衍生版；保留上游历史及 MIT 许可。修改起点为 `495b79ecb3524b20b2edc026067d7d0b0f407319`。完整来源及不同语料许可见仓库 [ATTRIBUTION.md](https://github.com/gaojing-ops/ziwei-doushu/blob/android-v1.1/ATTRIBUTION.md)。

## 下载与使用

- 下载附件 `Ziwei-DeepSeek-1.1.apk`，适用于 Android 7.0 及以上，需要正常更新的 Android System WebView。
- 应用 ID：`cn.local.ziweichart`；版本：1.1（versionCode 2）。本次为调试签名的个人测试构建，与此前提供的 1.0 使用同一证书，可覆盖安装；不含自动更新。
- 打开“DeepSeek 设置”，在手机上输入自己的 API Key，勾选资料发送与计费说明后保存；起盘后点击“开始解读”。支持流式回答、追问和停止。
- 密钥由 Android Keystore 加密后保存在应用私有存储；APK 未内置真实 API Key。保存配置不调用付费接口。排盘可离线，AI 功能需联网并按 DeepSeek 账户用量计费。
- AI 自动发送命盘结构、性别、虚岁、所选运限和问题，不自动发送姓名、出生日期、地点或经度；用户自行写入问题的资料也会随请求发给 DeepSeek。

## 本版修改

统一时间转换及换日处理；修复运限视图、年份状态不同步；适配安卓窄屏及宫位详情；增加离线安卓打包和可选 DeepSeek 调用。继承的排盘算法及知识内容来源于上游。

## 已知限制与验证

- 运限展示为本命十二宫与所选四化叠加，不是完整重排流年十二宫；真太阳时使用近似算法，按北京时间输入，夏令时需自行确认标准时间。
- 传统命理与 AI 解读仅供文化学习和参考，不保证预测准确；AI 可能遗漏条件或生成错误解释。
- 已通过类型检查、生产构建、命盘隐私回归、9 项移动浏览器场景、3 项原生 SSE 解析测试；APK 签名、权限及打包资源校验通过。此前时间与响应式回归结果见仓库文档。
- 浏览器场景使用模拟接口。**未使用真实 DeepSeek API Key 调用，未在实体安卓手机验证**，不代表已完成实机或真实账户验收。

APK SHA-256：

```text
b6b64d7fe7b556ff1ed8537d82a55539f5bfc75a5e4f35e9da5e35c0a0202215
```

附带校验文件、使用说明和验证记录。源码见本标签。代码 MIT，数据集及课程引文另按原许可；本 Release 不重新分发上游大型数据集。
