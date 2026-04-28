'use client';

import { useState } from 'react';
import CameraCapture from '@/components/CameraCapture';
import { Loader2, AlertTriangle, Info, ChevronRight, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

type AppStep = 'profile' | 'capture' | 'analyzing' | 'results';

export default function Home() {
  const [step, setStep] = useState<AppStep>('profile');
  const [userData, setUserData] = useState<{ name: string; age: string; id: string | null }>({
    name: '',
    age: '',
    id: null
  });
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProfile(true);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{ name: userData.name, age: parseInt(userData.age) }])
        .select()
        .single();

      if (error) throw error;
      
      setUserData({ ...userData, id: data.id });
      setStep('capture');
    } catch (err) {
      console.error('Error creating user:', err);
      // Fallback for demo if Supabase is not configured
      setStep('capture');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleCapture = async (base64Image: string) => {
    setStep('analyzing');
    setError(null);

    try {
      // 1. Send to Vision API for analysis
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: base64Image,
          userId: userData.id 
        })
      });

      if (!analyzeRes.ok) throw new Error('Analysis failed');
      const analysisResult = await analyzeRes.json();

      // 2. Send analysis result to Recommendation Engine
      const recommendRes = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          analysisResult,
          userId: userData.id,
          userName: userData.name
        })
      });

      if (!recommendRes.ok) throw new Error('Recommendation failed');
      const finalResults = await recommendRes.json();

      setResults(finalResults);
      setStep('results');
    } catch (err) {
      console.error(err);
      setError('Something went wrong during analysis. Please try again.');
      setStep('capture');
    }
  };

  const resetFlow = () => {
    setStep('capture');
    setResults(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-200">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-4 flex items-center justify-between">
        <div className="font-bold text-2xl tracking-tighter text-teal-800">
          FIX<span className="text-slate-800">DERMA</span>
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full">
          AI Clinic
        </div>
      </header>

      <div className="max-w-xl mx-auto pb-24">
        {step === 'profile' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-12 px-4">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold mb-4 tracking-tight text-slate-800">Welcome to AI Clinic</h1>
              <p className="text-slate-600">Please tell us a bit about yourself to personalize your skin assessment.</p>
            </div>

            <form onSubmit={handleProfileSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Your Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-teal-500 transition"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Your Age</label>
                <input
                  required
                  type="number"
                  placeholder="e.g. 25"
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-teal-500 transition"
                  value={userData.age}
                  onChange={(e) => setUserData({ ...userData, age: e.target.value })}
                />
              </div>

              <button
                disabled={isSubmittingProfile}
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-600/20 transition flex items-center justify-center gap-2"
              >
                {isSubmittingProfile ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    Continue to Scan
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {step === 'capture' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 px-4">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-3 tracking-tight text-slate-800">Discover Your Skin's Needs</h1>
              <p className="text-slate-600">Get a clinical-grade AI analysis in seconds and discover products tailored for your unique skin.</p>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100">
                <AlertTriangle size={20} className="shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2">
              <CameraCapture onCapture={handleCapture} />
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="min-h-[70vh] flex flex-col items-center justify-center animate-in fade-in duration-500 px-4">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-teal-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-teal-600 p-6 rounded-full shadow-xl shadow-teal-600/20">
                <Loader2 size={40} className="text-white animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-slate-800">Analyzing your skin...</h2>
            <p className="text-slate-500 text-center max-w-xs">Our AI is examining clinical markers to provide an accurate assessment.</p>
            
            <div className="mt-12 w-full max-w-xs space-y-3 opacity-60">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 w-2/3 animate-pulse"></div>
              </div>
              <p className="text-xs text-center text-slate-400 font-medium tracking-wide uppercase">Scanning for concerns</p>
            </div>
          </div>
        )}

        {step === 'results' && results && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pt-6">
            
            {/* Header section */}
            <div className="px-4 mb-6">
              <button 
                onClick={resetFlow}
                className="text-sm text-teal-600 font-medium mb-4 flex items-center hover:text-teal-700 transition"
              >
                <ChevronRight className="rotate-180 w-4 h-4 mr-1" />
                Retake Scan
              </button>
              <h2 className="text-3xl font-bold tracking-tight text-slate-800 mb-2">Your Results</h2>
              <p className="text-slate-600">Based on our clinical AI analysis.</p>
            </div>

            {/* Conditions Section */}
            <div className="px-4 mb-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 px-1">Detected Concerns</h3>
              
              {results.conditions && results.conditions.length > 0 ? (
                <div className="space-y-4">
                  {results.conditions.map((condition: any, index: number) => (
                    <div key={index} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-xl font-bold capitalize text-slate-800">
                            {condition.name.replace('_', ' ')}
                          </h4>
                          <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full capitalize
                            ${condition.severity === 'severe' ? 'bg-rose-100 text-rose-700' : 
                              condition.severity === 'moderate' ? 'bg-amber-100 text-amber-700' : 
                              'bg-emerald-100 text-emerald-700'}`}
                          >
                            {condition.severity} Severity
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-teal-600">{Math.round(condition.confidence * 100)}%</div>
                          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Confidence</div>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-3 bg-slate-50 p-4 rounded-xl">
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">What it is</p>
                          <p className="text-sm text-slate-700">{condition.education?.what}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Why it happens</p>
                          <p className="text-sm text-slate-700">{condition.education?.why}</p>
                        </div>
                        <div className="flex items-start gap-2 pt-2 border-t border-slate-200">
                          <Info className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                          <p className="text-xs text-slate-600 font-medium italic">{condition.education?.severity_note}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-emerald-50 text-emerald-800 p-6 rounded-2xl border border-emerald-100 text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">✨</span>
                  </div>
                  <h4 className="font-bold text-lg mb-1">Looking Good!</h4>
                  <p className="text-sm opacity-90">{results.message || "We didn't detect any major skin concerns in this image. Keep up with your daily routine."}</p>
                </div>
              )}
            </div>

            {/* Recommendations Section */}
            {results.recommended_products && results.recommended_products.length > 0 && (
              <div className="px-4 mb-10">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Clinical Solutions</h3>
                  {results.coupon && (
                    <span className="text-xs font-bold bg-teal-600 text-white px-2 py-1 rounded-md shadow-sm">
                      Code {results.coupon} applied
                    </span>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {results.recommended_products.map((product: any, index: number) => (
                    <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition flex flex-col">
                      <div className="relative h-48 bg-slate-50 p-4">
                        <Image 
                          src={product.image_url} 
                          alt={product.name}
                          fill
                          className="object-contain p-4"
                        />
                      </div>
                      <div className="p-5 flex flex-col flex-grow">
                        <div className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">{product.category}</div>
                        <h4 className="font-bold text-lg text-slate-800 mb-2 leading-tight">{product.name}</h4>
                        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{product.description}</p>
                        
                        <div className="mt-auto flex items-center justify-between">
                          <div className="font-bold text-xl text-slate-800">₹{product.price}</div>
                          <a 
                            href={`${product.buy_link}?coupon=${results.coupon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-slate-900 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition"
                          >
                            Buy Now
                            <ShoppingBag size={16} />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="px-4 mb-8">
              <div className="bg-slate-100 p-5 rounded-2xl text-xs text-slate-500 flex gap-3 border border-slate-200">
                <AlertTriangle size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Medical Disclaimer:</strong> This AI analysis is for informational purposes only and does not constitute a medical diagnosis. The recommendations are based on cosmetic concerns. For severe or persistent issues, please consult a certified dermatologist. Images are processed ephemerally and are not stored, in compliance with the DPDP Act 2023.
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
