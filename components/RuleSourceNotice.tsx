import { NI_MANUAL_SOURCE } from '@/lib/ziwei/ni-manual';

export default function RuleSourceNotice() {
  return <details className="rule-source-notice">
    <summary>规则来源与核对范围</summary>
    <p>这里区分三件事：排盘规则的来源、课程引文的出处、AI 自己生成的解释。来源链接存在，不表示解释必然正确，也不表示全部都是倪老师原话。</p>
    <p>本版对照《天机道》教材的规则表及 39 幅例盘图（含一幅重复盘）。教材中留空的月份按命宫与生时逆查为安星月，再构造测试参考日期；没有将这些参考日期冒充全部已证实的真实生日。</p>
    <p>特殊闰月保留真实生日和三十日序，只把安星月按下月处理。日历日期与安星变量分别显示，不把三十日改成廿九日。</p>
    <p>21 种星的庙旺表有 239 个无歧义格。天机在丑同格列了“庙”和“陷”，该格暂沿用上游参考并明确标注。部分例图与表格还有异文，本版默认采用教材表格的无歧义项。</p>
    <p>点选宫位后展开“本宫星曜的规则来源”，可查看每颗星的安星来源与亮度来源。没有直接教材依据的扩展星仍标作“上游扩展／待课程核实”。</p>
    <p><a href={NI_MANUAL_SOURCE.url} target="_blank" rel="noreferrer">查看教材镜像及原表</a> · <a href="https://github.com/gaojing-ops/ziwei-doushu/blob/android-v1.3/docs/ni-school-audit-1.3.md" target="_blank" rel="noreferrer">查看逐项核对记录</a></p>
    <p>教材来自第三方公开镜像，未冒充官方认证。课程短引文来自已署名整理；原资料可能有笔误。当前没有逐帧审听全部原视频，也没有验证命理预测有效。</p>
  </details>;
}
