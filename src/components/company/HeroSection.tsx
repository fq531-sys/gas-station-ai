'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';

export function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const scrollToAbout = () => {
    const element = document.getElementById('about');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 via-white to-white" />

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <div
          className={`transition-all duration-1000 delay-200 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-semibold text-gray-900 tracking-tight mb-6">
            优加油
          </h1>
        </div>

        <div
          className={`transition-all duration-1000 delay-400 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="text-2xl md:text-3xl lg:text-4xl text-gray-600 font-light tracking-tight mb-4">
            让管理加油站变轻松
          </p>
          <div className="flex justify-center mb-6">
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent rounded-full" />
          </div>
        </div>

        <div
          className={`flex items-center justify-center gap-6 md:gap-10 mb-8 transition-all duration-1000 delay-500 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className="text-xl md:text-2xl font-semibold text-gray-800">专业</span>
          <span className="text-xl md:text-2xl font-semibold text-[#FF6B00]">诚信</span>
          <span className="text-xl md:text-2xl font-semibold text-[#FF6B00]">共赢</span>
          <span className="text-xl md:text-2xl font-semibold text-gray-800">创新</span>
        </div>

        <div
          className={`transition-all duration-1000 delay-600 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-light leading-relaxed">
            专业的加油站行业服务/运营商
          </p>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-light leading-relaxed mt-1">
            提供全链路的管理服务与战略合作方案
          </p>
        </div>

        <div
          className={`mt-12 transition-all duration-1000 delay-800 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <button
            onClick={scrollToContact}
            className="group inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#E55D00] text-white px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 hover:shadow-xl hover:shadow-orange-200/50"
          >
            立即咨询
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </div>

      <button
        onClick={scrollToAbout}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors duration-300"
      >
        <span className="text-xs tracking-wider uppercase">Scroll</span>
        <ChevronDown className="w-4 h-4 animate-bounce" />
      </button>
    </section>
  );
}