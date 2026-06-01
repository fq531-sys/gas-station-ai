'use client';

import { ArrowUpRight } from 'lucide-react';

const navLinks = {
  '关于我们': [
    { label: '公司简介', href: '#about' },
    { label: '团队介绍', href: '#team' },
  ],
  '业务介绍': [
    { label: '运营托管', href: '#services' },
    { label: '咨询顾问', href: '#services' },
    { label: '管理培训', href: '#services' },
    { label: '投资评估', href: '#services' },
  ],
  '联系方式': [
    { label: '在线留言', href: '#contact' },
    { label: '咨询电话', href: 'tel:18007313173' },
    { label: '电子邮箱', href: 'mailto:185695457@qq.com' },
  ],
};

const clients = [
  '中国石化',
  '和顺石油',
  '中化石油',
  '长沙城发',
  '湘潭城发',
  '湘中石油',
  '富海能源',
  '道森石油',
  '卓之创',
  '龙都石化',
];

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-4 gap-12 md:gap-8">
          <div className="md:col-span-1">
            <button onClick={scrollToTop} className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B00] flex items-center justify-center">
                <span className="text-white font-semibold">优</span>
              </div>
              <span className="text-xl font-semibold tracking-tight">优加油</span>
            </button>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              专业的加油站行业服务/运营商<br />
              让管理加油站变轻松
            </p>
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} 优加油<br />
              保留所有权利
            </div>
          </div>

          {Object.entries(navLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-medium text-white mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors duration-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm text-gray-500">
              部分服务客户
            </div>
            <div className="flex flex-wrap gap-6">
              {clients.map((client) => (
                <span
                  key={client}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors duration-300 cursor-default"
                >
                  {client}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-xs text-gray-600">
              网站仅供展示，具体信息以实际为准
            </div>
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <span>ICP备案号：XXXXX</span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 w-12 h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center transition-colors duration-300 z-40"
        aria-label="回到顶部"
      >
        <ArrowUpRight className="w-5 h-5 rotate-[-45deg]" />
      </button>
    </footer>
  );
}