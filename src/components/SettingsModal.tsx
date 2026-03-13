import React from "react";
import { X, Moon, Sun, Type, Globe } from "lucide-react";
import { Language, TextSize, Theme } from "../App";
import { clsx } from "clsx";

interface SettingsModalProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onClose: () => void;
}

export function SettingsModal({
  language,
  setLanguage,
  textSize,
  setTextSize,
  theme,
  setTheme,
  onClose,
}: SettingsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Language Setting */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 font-medium">
              <Globe className="w-5 h-5" />
              <span>Language</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["English", "Punjabi", "Hindi"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={clsx(
                    "py-2 px-3 rounded-xl border font-medium transition-colors text-sm",
                    language === lang
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-500"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700",
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Setting */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 font-medium">
              {theme === "dark" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
              <span>Theme</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(["light", "dark"] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={clsx(
                    "py-2 px-3 rounded-xl border font-medium transition-colors text-sm capitalize flex items-center justify-center space-x-2",
                    theme === t
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-500"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700",
                  )}
                >
                  {t === "light" ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                  <span>{t}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Text Size Setting */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 font-medium">
              <Type className="w-5 h-5" />
              <span>Text Size</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["sm", "base", "lg"] as TextSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setTextSize(size)}
                  className={clsx(
                    "py-2 px-3 rounded-xl border font-medium transition-colors",
                    textSize === size
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-500"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700",
                    {
                      "text-sm": size === "sm",
                      "text-base": size === "base",
                      "text-lg": size === "lg",
                    },
                  )}
                >
                  {size === "sm"
                    ? "Small"
                    : size === "base"
                      ? "Medium"
                      : "Large"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
