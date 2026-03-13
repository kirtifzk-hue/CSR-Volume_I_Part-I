import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { clsx } from "clsx";
import { Language } from "../App";
import { GoogleGenAI } from "@google/genai";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
}

interface ChatScreenProps {
  language: Language;
}

export function ChatScreen({ language }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [bookText, setBookText] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await fetch("/book.txt");
        if (res.ok) {
          const text = await res.text();
          setBookText(text);
        }
      } catch (err) {
        console.error("Failed to fetch book text:", err);
      }
    };
    fetchBook();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !bookText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const systemInstruction = `You are a helpful AI assistant. You must answer the user's questions based ONLY on the provided book text. 
If the answer cannot be found in the book text, say "I cannot find the answer to this in the uploaded book."
You must provide your answer in the following language: ${language}.

Book Text:
${bookText.substring(0, 1000000)} // Limit to 1M chars to be safe
`;

      const contents = messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      contents.push({
        role: "user",
        parts: [{ text: userMessage.text }],
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2,
        },
      });

      if (response.text) {
        const modelMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: response.text,
        };
        setMessages((prev) => [...prev, modelMessage]);
      } else {
        console.error("Chat error: No text returned");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = async (messageId: string, text: string) => {
    if (playingAudioId === messageId) {
      // Stop playing
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }
      setPlayingAudioId(null);
      return;
    }

    try {
      // Stop any currently playing audio
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }

      setPlayingAudioId(messageId);

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Truncate text to avoid TTS limits and remove basic markdown
      const cleanText = text.replace(/[#*`_]/g, '').substring(0, 1000);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: cleanText }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
          },
        },
      });

      const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      const base64Audio = inlineData?.data;

      if (base64Audio) {
        if (!audioContextRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
        }
        
        const audioCtx = audioContextRef.current;
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        // Decode base64 to binary string
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Convert 16-bit PCM to Float32
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768.0;
        }

        const buffer = audioCtx.createBuffer(1, float32Array.length, 24000);
        buffer.getChannelData(0).set(float32Array);

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        
        source.onended = () => {
          if (audioSourceRef.current === source) {
            setPlayingAudioId(null);
            audioSourceRef.current = null;
          }
        };

        audioSourceRef.current = source;
        source.start(0);
      } else {
        console.error("TTS error: No audio generated");
        setPlayingAudioId(null);
      }
    } catch (error) {
      console.error("Failed to play audio:", error);
      setPlayingAudioId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
              <span className="text-3xl">📚</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Ask me anything about the book!
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              I will answer your questions based only on the uploaded PDF.
              Currently answering in{" "}
              <span className="font-medium text-indigo-600 dark:text-indigo-400">
                {language}
              </span>
              .
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx(
                "flex w-full",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={clsx(
                  "max-w-[85%] rounded-2xl p-4 shadow-sm relative group",
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700",
                )}
              >
                {msg.role === "model" && (
                  <button
                    onClick={() => playAudio(msg.id, msg.text)}
                    className="absolute -right-12 top-2 p-2 rounded-full bg-white dark:bg-gray-800 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    title={
                      playingAudioId === msg.id ? "Stop Audio" : "Play Audio"
                    }
                  >
                    {playingAudioId === msg.id ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                )}
                <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-gray-900">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto flex items-end space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question about the book..."
            className="flex-1 max-h-32 min-h-[56px] p-4 rounded-2xl bg-gray-100 dark:bg-gray-900 border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 text-white transition-colors flex-shrink-0"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
