"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Paperclip, Send, CheckCheck, Loader2 } from "lucide-react";
import Image from "next/image";

type Message = {
  id: string;
  sender: "user" | "bot";
  type: "text" | "image" | "product";
  content: string;
  product?: any;
};

export default function WhatsAppMockup() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      type: "text",
      content: "Hi there! 👋 Welcome to Fixderma AI Clinic. Upload a photo of your skin concern, and I'll analyze it for you.",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;

      const userMsgId = Date.now().toString();
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, sender: "user", type: "image", content: base64 },
      ]);

      setIsTyping(true);

      // Mimic process time
      await new Promise((r) => setTimeout(r, 1500));

      const botMsgId1 = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: botMsgId1, sender: "bot", type: "text", content: "Analyzing your skin... one moment." },
      ]);

      try {
        const base64Data = base64.split(",")[1];
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64Data, userId: "whatsapp_mock" }),
        });
        const analysis = await res.json();

        const recRes = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysisResult: analysis, userId: "whatsapp_mock" }),
        });
        const recommendations = await recRes.json();

        setIsTyping(false);

        let conditionText = "some concerns";
        let isDarkPatches = false;
        
        if (analysis.conditions && analysis.conditions.length > 0) {
          const primary = analysis.conditions[0];
          if (primary.name === "dark_patches") {
            conditionText = "Acanthosis Nigricans on the affected area";
            isDarkPatches = true;
          } else {
            conditionText = primary.name.replace("_", " ");
          }
        }

        const botMsgId2 = (Date.now() + 2).toString();
        setMessages((prev) => [
          ...prev,
          { id: botMsgId2, sender: "bot", type: "text", content: `I see some signs of **${conditionText}**.` },
        ]);

        if (recommendations.recommended_products && recommendations.recommended_products.length > 0) {
          let heroProduct = recommendations.recommended_products[0];
          
          if (isDarkPatches) {
            const nigrifix = recommendations.recommended_products.find((p: any) => p.name.toLowerCase().includes("nigrifix"));
            if (nigrifix) heroProduct = nigrifix;
          }

          const botMsgId3 = (Date.now() + 3).toString();
          setMessages((prev) => [
            ...prev,
            { id: botMsgId3, sender: "bot", type: "product", content: "Here is what I recommend:", product: heroProduct },
          ]);

          const botMsgId4 = (Date.now() + 4).toString();
          setMessages((prev) => [
            ...prev,
            { id: botMsgId4, sender: "bot", type: "text", content: "⚠️ This is an AI-powered assessment. Consult a dermatologist for medical advice." },
          ]);
        }

      } catch (error) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), sender: "bot", type: "text", content: "Sorry, I ran into an issue analyzing that image." },
        ]);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 bg-[#25D366] text-white px-5 py-3 rounded-full shadow-xl hover:bg-[#20b858] transition-all transform hover:scale-105"
          >
            {/* WhatsApp Icon */}
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.81 11.81 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413z" />
            </svg>
            <span className="font-semibold hidden sm:inline">Simulate WhatsApp</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-[350px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-3rem)] bg-[#efeae2] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-200"
          >
            {/* Header */}
            <div className="bg-[#008069] text-white p-3 flex items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
                  <Image src="/favicon.ico" alt="Fixderma" width={40} height={40} className="object-contain p-1" />
                </div>
                <div>
                  <div className="font-semibold flex items-center gap-1">
                    Fixderma AI Assistant
                    <CheckCheck size={16} className="text-[#34B7F1]" />
                  </div>
                  <div className="text-xs text-green-100">Always active</div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: 'contain', backgroundRepeat: 'repeat' }}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-2 shadow-sm relative ${
                      msg.sender === "user" ? "bg-[#d9fdd3] rounded-tr-none" : "bg-white rounded-tl-none"
                    }`}
                  >
                    {msg.type === "text" && (
                      <div className="text-[14px] text-gray-800 break-words" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    )}
                    {msg.type === "image" && (
                      <div className="relative w-48 h-48 rounded overflow-hidden mb-1">
                        <Image src={msg.content} alt="Uploaded" fill className="object-cover" />
                      </div>
                    )}
                    {msg.type === "product" && msg.product && (
                      <div className="bg-white rounded border border-gray-100 overflow-hidden w-64">
                        <div className="text-[14px] text-gray-800 p-2 mb-1 bg-gray-50/50">{msg.content}</div>
                        <div className="relative w-full h-36 bg-gray-50">
                          {msg.product.image_url ? (
                            <Image src={msg.product.image_url} alt={msg.product.name} fill className="object-contain p-2" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                          )}
                        </div>
                        <div className="p-3 space-y-2">
                          <h4 className="font-semibold text-sm line-clamp-2 leading-tight text-gray-800">{msg.product.name}</h4>
                          {msg.product.category && (
                            <span className="inline-block text-[10px] bg-[#e8f5e9] text-[#2e7d32] px-2 py-0.5 rounded-full font-medium">{msg.product.category}</span>
                          )}
                          <div className="text-[#008069] font-bold text-base">₹{msg.product.price}</div>
                          
                          {msg.product.ingredients && msg.product.ingredients.length > 0 && (
                            <div>
                              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Key Ingredients</div>
                              <div className="flex flex-wrap gap-1">
                                {msg.product.ingredients.slice(0, 4).map((ing: string, i: number) => (
                                  <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{ing}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {msg.product.usage && (
                            <div>
                              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">How to Use</div>
                              <p className="text-[11px] text-gray-600 leading-snug">{msg.product.usage}</p>
                            </div>
                          )}

                          {msg.product.expected_results_timeline && (
                            <div>
                              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Expected Results</div>
                              <p className="text-[11px] text-gray-600 leading-snug">{msg.product.expected_results_timeline}</p>
                            </div>
                          )}

                          <a
                            href={`${msg.product.buy_link}?UTM_SOURCE=whatsapp_mock`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full bg-[#008069] text-white text-center py-2 rounded text-sm font-medium hover:bg-[#006653] transition-colors mt-2"
                          >
                            Buy Now →
                          </a>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end items-center gap-1 mt-1">
                      <span className="text-[10px] text-gray-500">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.sender === "user" && <CheckCheck size={14} className="text-[#53bdeb]" />}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </motion.div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-[#f0f2f5] p-2 flex items-center gap-2 z-10">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
              >
                <Camera size={24} />
              </button>
              
              <div className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-gray-500 shadow-sm border border-gray-100">
                Click camera to test photo...
              </div>

              <div className="w-10 h-10 bg-[#008069] rounded-full flex items-center justify-center text-white shadow-sm">
                <Send size={18} className="ml-1" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
