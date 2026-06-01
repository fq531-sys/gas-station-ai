'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { HeroSection } from '@/components/company/HeroSection';
import { AboutSection } from '@/components/company/AboutSection';
import { ServicesSection } from '@/components/company/ServicesSection';
import { TeamSection } from '@/components/company/TeamSection';
import { ContactSection } from '@/components/company/ContactSection';
import { Footer } from '@/components/company/Footer';

const navItems = [
  { id: 'about', label: '关于我们' },
  { id: 'services', label: '业务介绍' },
  { id: 'team', label: '团队介绍' },
  { id: 'contact', label: '联系我们' },
];

export default function CompanyPage() {
  const [activeSection, setActiveSection] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => scrollToSection('home')}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FF6B00] flex items-center justify-center shadow-sm">
                <span className="text-white font-semibold text-sm">优加油</span>
              </div>
              <span className="text-xl font-semibold tracking-tight text-gray-900">优加油</span>
            </button>

            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-sm transition-colors duration-300 ${
                    activeSection === item.id
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="hidden md:block">
              <button
                onClick={() => scrollToSection('contact')}
                className="text-sm font-medium text-gray-900 hover:text-[#FF6B00] transition-colors duration-300"
              >
                立即咨询 →
              </button>
            </div>

            <button
              className="md:hidden p-2 -mr-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-gray-900" />
              ) : (
                <Menu className="w-5 h-5 text-gray-900" />
              )}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100">
            <nav className="px-6 py-6 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`block w-full text-left py-3 text-base transition-colors duration-300 ${
                    activeSection === item.id
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-500'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4">
                <button
                  onClick={() => scrollToSection('contact')}
                  className="w-full py-3 bg-[#FF6B00] hover:bg-[#E55D00] text-white rounded-full font-medium transition-colors duration-300"
                >
                  立即咨询
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="pt-16">
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <TeamSection />
        <ContactSection />
        <Footer />
      </main>
    </div>
  );
}