/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ChatScreen } from "./components/ChatScreen";
import { SettingsModal } from "./components/SettingsModal";
import { LoginScreen } from "./components/LoginScreen";
import { AdminPanel } from "./components/AdminPanel";
import { Settings, LogOut, Users, Upload, FileText } from "lucide-react";
import { clsx } from "clsx";
import { auth, checkIsAllowed, logOut } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import * as pdfjsLib from "pdfjs-dist";

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export type Language = "English" | "Punjabi" | "Hindi";
export type TextSize = "sm" | "base" | "lg";
export type Theme = "light" | "dark";

export default function App() {
  const [bookText, setBookText] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [language, setLanguage] = useState<Language>("English");
  const [textSize, setTextSize] = useState<TextSize>("base");
  const [theme, setTheme] = useState<Theme>("light");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const allowed = await checkIsAllowed(currentUser.email);
        setIsAllowed(allowed);
      } else {
        setIsAllowed(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ") + "\n";
        }
        setBookText(text);
      } else if (file.type === "text/plain") {
        const text = await file.text();
        setBookText(text);
      } else {
        alert("Please upload a PDF or Text file.");
      }
    } catch (error) {
      console.error("Error reading file:", error);
      alert("Failed to read the file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 dark:text-white">
        Loading...
      </div>
    );
  }

  const isAdmin = user?.email === "kirtifzk@gmail.com";

  return (
    <div
      className={clsx(
        "min-h-screen flex flex-col transition-colors duration-200",
        "bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100",
        {
          "text-sm": textSize === "sm",
          "text-base": textSize === "base",
          "text-lg": textSize === "lg",
        },
      )}
    >
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
          HimankBhalla
        </h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setIsAdminPanelOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Manage Access"
            >
              <Users className="w-6 h-6" />
            </button>
          )}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Settings"
          >
            <Settings className="w-6 h-6" />
          </button>
          {user && (
            <button
              onClick={logOut}
              className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
              title="Log out"
            >
              <LogOut className="w-6 h-6" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        {!user ? (
          <LoginScreen onLogin={() => {}} />
        ) : !isAllowed ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full">
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                Access Denied
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Your email address ({user.email}) is not on the allowed list. Please contact the administrator for access.
              </p>
              <button
                onClick={logOut}
                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : !bookText ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full flex flex-col items-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Upload a Book
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Please upload a PDF or Text file to start chatting with it.
              </p>
              
              <label className="w-full cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                {isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Select PDF or TXT File
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        ) : (
          <ChatScreen language={language} bookText={bookText} />
        )}
      </main>

      {isSettingsOpen && (
        <SettingsModal
          language={language}
          setLanguage={setLanguage}
          textSize={textSize}
          setTextSize={setTextSize}
          theme={theme}
          setTheme={setTheme}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isAdminPanelOpen && (
        <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />
      )}
    </div>
  );
}
