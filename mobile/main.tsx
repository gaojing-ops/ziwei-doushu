import React from 'react';
import { createRoot } from 'react-dom/client';
import ChartApp from '../components/ChartApp';
import { ThemeProvider, useTheme } from '../components/ThemeProvider';
import '../app/globals.css';
import './mobile.css';
import { DeepSeekPanel, DeepSeekSettings, useAiSettings } from './deepseek/DeepSeekUi';

function App() {
  const { theme, toggle } = useTheme();
  const [showAbout, setShowAbout] = React.useState(false);
  const [showAiSettings, setShowAiSettings] = React.useState(false);
  const ai = useAiSettings();
  const openAiSettings = () => { setShowAiSettings(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return <>
    <div className="mobile-app-toolbar">
      <strong>紫微命盘 <small>本地排盘</small></strong>
      <div>
        <button onClick={toggle} aria-label="切换主题">{theme === 'dark' ? '浅色' : '深色'}</button>
        <button onClick={openAiSettings}>DeepSeek 设置</button>
        <button onClick={() => setShowAbout(value => !value)} aria-expanded={showAbout}>关于</button>
      </div>
    </div>
    {showAiSettings && <DeepSeekSettings settings={ai.settings} onSaved={ai.update} onClose={() => setShowAiSettings(false)} />}
    {showAbout && <section className="mobile-about" aria-label="关于应用">
      <h2>紫微命盘 1.1 · 自用版</h2>
      <p>支持离线排盘、真太阳时校正、本命／大限／流年四化及宫位详情。出生时间按北京时间输入，夏令时需先自行确认标准时间。</p>
      <p>基于 Renhuai123/ziwei-doushu 开源项目，保留其 MIT 许可。传统命理内容仅供文化学习与参考。</p>
      <p>AI 解读可选直连 DeepSeek，由你填写自己的 API Key。密钥由安卓系统密钥加密保存；仅主动解读时发送命盘和问题，按官方 API 用量计费。排盘和宫位详情仍可离线使用。</p>
      <a href="./OPEN_SOURCE_NOTICES.txt">查看开源许可</a>
    </section>}
    <ChartApp localOnly renderInsights={context => <DeepSeekPanel key={`${ai.revision}:${context.view}:${context.liunianYear}:${context.selectedPalace?.branch ?? 'all'}`}
      context={context} settings={ai.settings} onSettings={openAiSettings} />} />
  </>;
}

createRoot(document.getElementById('root')!).render(<ThemeProvider><App /></ThemeProvider>);
