'use client';

export interface TelegramTheme {
  bg_color: string;
  text_color: string;
  hint_color: string;
  link_color: string;
  button_color: string;
  button_text_color: string;
  secondary_bg_color: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            username?: string;
            first_name?: string;
          };
        };
        themeParams: Partial<TelegramTheme>;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
        showAlert: (message: string, callback?: () => void) => void;
        colorScheme: 'light' | 'dark';
        version: string;
      };
    };
  }
}

const DEFAULT_THEME: TelegramTheme = {
  bg_color: '#ffffff',
  text_color: '#000000',
  hint_color: '#999999',
  link_color: '#2678b6',
  button_color: '#2678b6',
  button_text_color: '#ffffff',
  secondary_bg_color: '#f0f0f0',
};

export function getTelegram() {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

export function getInitData(): string {
  return window.Telegram?.WebApp?.initData ?? '';
}

export function expand(): void {
  getTelegram()?.expand();
}

export function ready(): void {
  getTelegram()?.ready();
}

export function close(): void {
  getTelegram()?.close();
}

export function getTheme(): TelegramTheme {
  const tg = getTelegram();
  if (!tg) return DEFAULT_THEME;
  return {
    bg_color: tg.themeParams.bg_color ?? DEFAULT_THEME.bg_color,
    text_color: tg.themeParams.text_color ?? DEFAULT_THEME.text_color,
    hint_color: tg.themeParams.hint_color ?? DEFAULT_THEME.hint_color,
    link_color: tg.themeParams.link_color ?? DEFAULT_THEME.link_color,
    button_color: tg.themeParams.button_color ?? DEFAULT_THEME.button_color,
    button_text_color: tg.themeParams.button_text_color ?? DEFAULT_THEME.button_text_color,
    secondary_bg_color: tg.themeParams.secondary_bg_color ?? DEFAULT_THEME.secondary_bg_color,
  };
}

export function showAlert(message: string): void {
  const tg = getTelegram();
  if (tg?.showAlert) {
    tg.showAlert(message);
  } else {
    alert(message);
  }
}

export function showMainButton(text: string, callback: () => void): void {
  const tg = getTelegram();
  if (!tg) return;
  tg.MainButton.text = text;
  tg.MainButton.onClick(callback);
  tg.MainButton.show();
}

export function hideMainButton(): void {
  getTelegram()?.MainButton.hide();
}
