import React, { useEffect, useRef, useState } from 'react';
import { DeepSeek, EMPTY_SETTINGS, MODELS, aiError, nativeAiAvailable, type AiMessage, type AiSettings } from './native';
import { requestMessages, type ChartAiContext } from './prompt';

export function useAiSettings() {
  const [settings, setSettings] = useState<AiSettings>(EMPTY_SETTINGS);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (nativeAiAvailable()) DeepSeek.getSettings().then(setSettings).catch(() => {});
  }, []);
  return { settings, revision, update: (next: AiSettings) => { setSettings(next); setRevision(value => value + 1); } };
}

export function DeepSeekSettings({ settings, onSaved, onClose }: {
  settings: AiSettings; onSaved: (next: AiSettings) => void; onClose: () => void;
}) {
  const [key, setKey] = useState('');
  const [model, setModel] = useState(settings.model);
  const [limit, setLimit] = useState(settings.maxTokens);
  const [consent, setConsent] = useState(settings.consent);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setStatus('');
    try {
      const next = await DeepSeek.saveSettings({ apiKey: key.trim() || undefined, model, maxTokens: limit, consent });
      setKey(''); onSaved(next); setStatus('已加密保存在手机。返回命盘后点击“开始解读”。');
    } catch (error) { setError(aiError(error)); } finally { setBusy(false); }
  }
  async function clear() {
    setBusy(true); setError(''); setStatus('');
    try { const next = await DeepSeek.clearKey(); setKey(''); setConsent(false); onSaved(next); setStatus('已删除本机密钥，AI 解读已关闭。'); }
    catch (error) { setError(aiError(error)); } finally { setBusy(false); }
  }
  return <section className="mobile-ai-settings" aria-label="DeepSeek 设置">
    <div className="ai-section-heading"><h2>DeepSeek 设置</h2><button onClick={onClose} disabled={busy}>收起</button></div>
    {!nativeAiAvailable() ? <p>密钥加密与直连接口仅在安卓 APP 中可用。网页预览不接收或保存密钥，请安装新版 APK 后填写。</p> : <form onSubmit={save}>
      <p>状态：{settings.configured ? '已配置密钥' : '未配置'}。API Key 在手机上用系统密钥加密保存，保存设置不会发起付费请求。</p>
      <label>DeepSeek API Key
        <input type="password" aria-label="DeepSeek API Key" value={key} onChange={event => setKey(event.target.value)}
          autoComplete="off" spellCheck={false} autoCapitalize="none" maxLength={256} disabled={busy}
          placeholder={settings.configured ? '留空保留已保存的密钥' : '粘贴你自己的 API Key'} />
      </label>
      <label>模型<select aria-label="DeepSeek 模型" value={model} disabled={busy} onChange={event => setModel(event.target.value as AiSettings['model'])}>
        {MODELS.map(value => <option key={value} value={value}>{value === 'deepseek-flash' ? 'Flash（默认）' : 'V4 Pro'}</option>)}
      </select></label>
      <label>单次回答上限<select aria-label="回答长度" value={limit} disabled={busy} onChange={event => setLimit(Number(event.target.value))}>
        <option value={1024}>简短 · 1024 tokens</option><option value={2048}>标准 · 2048 tokens</option>
      </select></label>
      <label className="ai-consent"><input type="checkbox" checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)} />
        我同意在主动点击解读或追问时，将命盘星曜、性别、虚岁、所选运限及输入的问题发给 DeepSeek。系统不会附带姓名、出生日期或出生地点；我的问题若包含这些内容，也会随问题发送。接口按 DeepSeek 账户用量计费。
      </label>
      <div className="ai-actions"><button type="submit" disabled={busy || !consent || (!settings.configured && !key.trim())}>保存设置</button>
        <button type="button" disabled={busy || !settings.configured} onClick={clear}>删除密钥</button></div>
      <p role="status">{status}</p>{error && <p role="alert">{error}</p>}
    </form>}
    <p className="ai-help">在 DeepSeek 官方开放平台创建 API Key；不要把密钥发到聊天或分享给他人。</p>
  </section>;
}

interface Turn { role: 'user' | 'assistant'; content: string; complete: boolean }
const TOPICS = [
  { key: 'overview', label: '命格总览', question: '请解读本次视图的命盘总体特征，列出主要依据与不确定处。' },
  { key: 'personality', label: '性格', question: '请结合命宫及三方四正解读性格倾向，避免绝对判断。' },
  { key: 'career', label: '事业', question: '请结合官禄、财帛和迁移宫解释传统事业倾向与一般生活建议。' },
  { key: 'wealth', label: '财运', question: '请解释财帛、田宅及相关四化的传统含义，不给投资买卖指令。' },
  { key: 'love', label: '感情', question: '请解释夫妻宫与相关星曜的传统含义，不断言关系结果或具体发生时间。' },
  { key: 'palace', label: '所选宫位', question: '请重点解释 focusPalace 所选宫位，区分本命事实和运限叠加的影响。' },
];
function Answer({ text }: { text: string }) {
  return <div className="ai-answer">{text.split('\n').map((line, index) => <p key={index}>
    {line.replace(/^#{1,4}\s+/, '').split(/(\*\*[^*]+\*\*)/).map((part, i) => part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong> : part)}
  </p>)}</div>;
}
export function DeepSeekPanel({ context, settings, onSettings }: { context: ChartAiContext; settings: AiSettings; onSettings: () => void }) {
  const [topic, setTopic] = useState('overview');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const request = useRef<string | null>(null);
  const mounted = useRef(true);
  const stopping = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (request.current) void DeepSeek.cancel({ requestId: request.current }).catch(() => {});
      request.current = null;
    };
  }, []);

  async function run(text: string, restart: boolean) {
    if (request.current || !text.trim() || !settings.configured || !nativeAiAvailable()) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    request.current = id; stopping.current = false; setBusy(true); setError(''); setNotice('');
    const history = restart ? [] : turns.filter(turn => turn.complete).slice(-8);
    const pending: Turn[] = [...history, { role: 'user', content: text, complete: false }, { role: 'assistant', content: '', complete: false }];
    setTurns(pending); setQuestion('');
    let listener: Awaited<ReturnType<typeof DeepSeek.addListener>> | undefined;
    let partial = '';
    try {
      listener = await DeepSeek.addListener('deepseekChunk', chunk => {
        if (!mounted.current || request.current !== id || chunk.requestId !== id || stopping.current) return;
        partial += chunk.text;
        setTurns([...pending.slice(0, -1), { role: 'assistant', content: partial, complete: false }]);
      });
      if (!mounted.current || request.current !== id) return;
      if (stopping.current) throw { code: 'CANCELLED' };
      const result = await DeepSeek.interpret({ requestId: id, messages: requestMessages(context, history as AiMessage[], text) });
      if (!mounted.current || request.current !== id) return;
      if (stopping.current) throw { code: 'CANCELLED' };
      setTurns([...history, { role: 'user', content: text, complete: true }, { role: 'assistant', content: result.text, complete: true }]);
      setNotice(result.finishReason === 'length' ? '回答达到长度上限，可能不完整；可缩小问题范围后继续追问。'
        : result.completionTokens !== undefined ? `本次输出 ${result.completionTokens} tokens` : '解读完成');
    } catch (error) {
      if (mounted.current && request.current === id) { setNotice(''); setError(aiError(error)); }
    } finally {
      await listener?.remove().catch(() => {});
      if (mounted.current && request.current === id) { request.current = null; setBusy(false); }
    }
  }
  async function stop() {
    if (!request.current) return;
    stopping.current = true; setNotice('正在停止…');
    await DeepSeek.cancel({ requestId: request.current }).catch(() => {});
  }
  const label = context.view === 'mingpan' ? '本命' : context.view === 'daxian' ? '当前大限四化' : `${context.liunianYear} 流年四化`;
  return <section className="deepseek-panel" aria-label="DeepSeek 解读">
    <div className="ai-section-heading"><h2>DeepSeek 解读</h2><button onClick={onSettings}>设置</button></div>
    <p className="ai-context">{label}{context.selectedPalace ? ` · ${context.selectedPalace.name}` : ''} · {settings.model}</p>
    <p className="ai-help">排盘可离线；AI 需要联网。仅主动发送时将必要命盘和问题交给 DeepSeek，按 API 用量计费。切换年份、视图或宫位会清空对话。</p>
    {!settings.configured && <p>尚未配置 API Key。<button className="ai-inline-action" onClick={onSettings}>设置 DeepSeek</button></p>}
    <div className="ai-controls"><label>解读主题<select aria-label="解读主题" value={topic} disabled={busy} onChange={event => setTopic(event.target.value)}>
      {TOPICS.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
    </select></label><button className="ai-primary" disabled={busy || !settings.configured || (topic === 'palace' && !context.selectedPalace)}
      onClick={() => run(TOPICS.find(item => item.key === topic)!.question, true)}>{turns.length ? '重新解读' : '开始解读'}</button></div>
    <div className="ai-conversation" aria-live="polite" aria-busy={busy}>
      {turns.map((turn, index) => <article key={index} className={`ai-turn ai-turn-${turn.role}`}>
        <small>{turn.role === 'user' ? '你的问题' : 'DeepSeek'}{turn.role === 'assistant' && !turn.complete ? ' · 未完成' : ''}</small>
        <Answer text={turn.content || '正在等待回答…'} />
      </article>)}
    </div>
    {error && <p role="alert" className="ai-error">{error}</p>}
    <p role="status" className="ai-help">{notice}</p>
    {busy && <button className="ai-stop" onClick={stop}>停止解读</button>}
    <form className="ai-followup" onSubmit={event => { event.preventDefault(); void run(question, false); }}>
      <label>继续追问<textarea aria-label="追问内容" maxLength={2000} value={question} disabled={busy || !settings.configured}
        onChange={event => setQuestion(event.target.value)} placeholder="输入想了解的问题，避免填写无关个人资料" rows={3} /></label>
      <div className="ai-actions"><button type="submit" disabled={busy || !settings.configured || !question.trim()}>发送追问</button>
        <button type="button" disabled={busy || !turns.length} onClick={() => { setTurns([]); setError(''); setNotice(''); }}>清空对话</button></div>
    </form>
  </section>;
}
