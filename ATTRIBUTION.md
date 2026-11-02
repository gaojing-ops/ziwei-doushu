# 来源、修改与许可

本仓库是 [Renhuai123/ziwei-doushu](https://github.com/Renhuai123/ziwei-doushu) 的非官方衍生版本，由 [gaojing-ops](https://github.com/gaojing-ops) 发布。原项目作者及贡献者保留其权利；本版本不代表上游、OURANIC、倪海厦先生或 DeepSeek 的官方产品、认证或背书。

## 上游来源

- 原项目：**紫微斗数 · 开源排盘引擎**。
- 项目作者标注：**王多鱼AI**；原代码版权声明：`Copyright (c) 2026 紫微研究`。
- 本次修改的起点：[495b79ecb3524b20b2edc026067d7d0b0f407319](https://github.com/Renhuai123/ziwei-doushu/commit/495b79ecb3524b20b2edc026067d7d0b0f407319)。保留上游 Git 历史及原始版权、许可文件。
- 原中文说明保存在 [README.upstream.md](README.upstream.md)，英文说明见 [README.en.md](README.en.md)。上游的线上网站、数据集规模和历史发布说明不表示本 APK 含有对应服务或数据集。

## 本版本修改

2026-11-02：统一表单预览、直接排盘和分享还原的时间转换，修复真太阳时跨日及子时换日处理；统一运限视图与年份状态；适配安卓窄屏及宫位详情；增加 Capacitor 安卓离线应用；增加用户自填密钥的 DeepSeek 原生调用、流式回答、追问、取消及错误提示；补充回归测试。具体见 [修复记录](docs/local-fixes.md) 和 [安卓说明](docs/android-app.md)。

2026-11-02 的 1.2 追加：落实午夜换日、闰月归下月、生年四化固定和行限宫位；按课程首例修正辛年魁钺；加入 3 个课程案例的有限断言，离线教学引文检索、出处与引用编号检查。完整证据及未核验范围见 [教学核对记录](docs/ni-school-audit.md)。APP 现含 CC BY-NC-SA 4.0 课程材料，仅供非商业学习研究，代码 MIT 不覆盖这些材料。

原有排盘算法及知识内容主要继承自上游，本版本不将其声明为全新原创。新增、修改的代码沿用 MIT 许可。

1.3 追加：对照《天机道（天纪系列）》20100907 非打印第一版的安星事实、庙旺表及 39 幅例图，修复特殊闰月日序、解神重复及表格口径，加入逐星出处、冲突标注及直接引文校验。教材来自 [Shanemen/hantang-nihaixia 固定镜像 27b8ce5](https://github.com/Shanemen/hantang-nihaixia/blob/27b8ce5b942ca166610ac5e38b9eac0afa913ff9/%E5%80%AA%E6%B5%B7%E5%8E%A6/%E5%A4%A9%E7%BA%AA/%E5%A4%A9%E6%9C%BA%E9%81%93-%E6%95%99%E6%9D%90.pdf)，不是官方认证来源。教材著作及排版权利归原权利人，本项目未取得将整本教材重新授权的依据，不打包整本 PDF；规则事实与有限位置转录用于非商业学习核对，没有把镜像许可套用到原教材。例图月份留空者的参考输入为软件核对而推导，并非已查实完整真实生日。详见 [1.3 核对记录](docs/ni-school-audit-1.3.md)。

## 不同内容的许可

| 内容 | 来源与许可 |
| --- | --- |
| 仓库代码 | [LICENSE](LICENSE)，MIT。完整保留原版权声明。 |
| 上游 Release 中的 v3.0/v4.0 大型数据集 | [DATASET-LICENSE](DATASET-LICENSE)，按上游规定适用 CC BY 4.0 及署名要求；本 Release 不重新分发这些数据集，APK 不附带这些大型数据集。 |
| `docs/tianji-ziwei/` 课程短引文整理 | [该目录许可](docs/tianji-ziwei/LICENSE.md)，CC BY-NC-SA 4.0；课程著作权归原权利人。不能因代码采用 MIT 而将该语料视为 MIT 或任意商用。 |
| `lib/ziwei/ni-manual-data.json`、`docs/ni-manual-cases.json` 的教材事实／位置转录 | 出处为上述《天机道》教材固定镜像，原教材权利归原权利人；不是整本教材或其排版的重新授权，不冒充 MIT 或 CC BY-NC-SA 教材。 |
| 古籍原文 | 按上游说明属于公有领域；现代课程、整理及其他内容仍须分别核对权利。 |
| 第三方运行时依赖 | 各自许可；APK 中可通过“关于 → 查看开源许可”查看已打包的前端依赖声明。Capacitor、AndroidX 等原生依赖遵循其各自 MIT / Apache-2.0 等许可。 |

DeepSeek 是可选第三方服务，由用户自行申请 API Key 并承担官方 API 用量费用；模型回答并非上游作者、课程原作者或本项目维护者核验过的引文及结论。
