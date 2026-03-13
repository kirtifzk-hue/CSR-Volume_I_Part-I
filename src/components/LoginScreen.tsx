import React from "react";
import { signInWithGoogle } from "../firebase";
import { LogIn } from "lucide-react";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      onLogin();
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to HimankBhalla
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          This app is currently invite-only. Please sign in with your allowed Google account to continue.
        </p>
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          <LogIn className="w-5 h-5" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
