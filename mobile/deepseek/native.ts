import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export const MODELS = ['deepseek-flash', 'deepseek-v4-pro'] as const;
export type DeepSeekModel = typeof MODELS[number];
export interface AiSettings { configured: boolean; model: DeepSeekModel; maxTokens: number; consent: boolean }
export interface AiMessage { role: 'system' | 'user' | 'assistant'; content: string }
export interface AiResult { text: string; finishReason: string; promptTokens?: number; completionTokens?: number }
interface DeepSeekBridge {
  getSettings(): Promise<AiSettings>;
  saveSettings(options: { apiKey?: string; model: DeepSeekModel; maxTokens: number; consent: boolean }): Promise<AiSettings>;
  clearKey(): Promise<AiSettings>;
  interpret(options: { requestId: string; messages: AiMessage[] }): Promise<AiResult>;
  cancel(options: { requestId: string }): Promise<void>;
  addListener(event: 'deepseekChunk', listener: (chunk: { requestId: string; text: string }) => void): Promise<PluginListenerHandle>;
}
export const DeepSeek = registerPlugin<DeepSeekBridge>('DeepSeek');
export const nativeAiAvailable = () => Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('DeepSeek');
export const EMPTY_SETTINGS: AiSettings = { configured: false, model: 'deepseek-flash', maxTokens: 2048, consent: false };
export function aiError(error: unknown): string {
  const code = typeof error === 'object' && error ? String((error as { code?: unknown }).code || '') : '';
  return ({
    AUTH: 'DeepSeek 密钥无效，请在设置里重新填写。', BALANCE: 'DeepSeek API 余额不足，请在官方平台查看余额。',
    RATE_LIMIT: '请求过于频繁，请稍后手动重试。', MODEL: '模型或请求参数不被支持，请更新应用或更换模型。',
    SERVER: 'DeepSeek 服务暂不可用，请稍后手动重试。', NETWORK: '连接失败，请检查手机网络。',
    TIMEOUT: '等待响应超时，请稍后手动重试。', CANCELLED: '已停止本次解读。', BUSY: '上一请求正在结束，请稍后重试。',
    KEY_MISSING: '请先在 DeepSeek 设置中保存密钥并确认发送范围。', SECURE_STORAGE: '系统加密存储不可用，请重新保存密钥。',
    INVALID_KEY: '密钥格式不正确，请完整粘贴 API Key。', INVALID_REQUEST: '请求内容过长或格式无效，请缩短问题或清空对话。',
    INCOMPLETE: '响应中途断开，下面的内容可能不完整，请手动重试。',
  } as Record<string, string>)[code] || '解读未完成，请检查设置后重试。';
}
