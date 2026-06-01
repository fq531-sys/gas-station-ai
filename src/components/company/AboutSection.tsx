'use client';

import { useEffect, useRef, useState } from 'react';

// 优加油成绩单 - 阶梯式展示
const achievements = [
  { title: '1', subtitle: '多品牌从0到1整体孵化包装营销策划经验', position: 'top' },
  { title: '10', subtitle: '超十家连锁型油企培训与服务经验', position: 'bottom' },
  { title: '100', subtitle: '超百家加油站现场运营管理经验', position: 'top' },
  { title: '1000', subtitle: '超千人加油站行业培训经验', position: 'bottom' },
  { title: '自有品牌', subtitle: '优加油自有品牌油站运营经验', position: 'top' },
];

export function AboutSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="py-24 md:py-32 bg-white relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/30 to-white pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <div
          className={`mb-20 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="hidden md:block relative max-w-4xl mx-auto">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#FF6B00]/30 to-transparent"
                 style={{ transform: 'translateY(-50%)' }} />

            <div className="flex justify-between items-center">
              {achievements.map((item, index) => (
                <div key={index} className="flex flex-col items-center relative">
                  {item.position === 'top' && (
                    <div className="mb-6 text-center">
                      <div className="text-xl md:text-2xl font-semibold text-[#FF6B00] mb-1">
                        {item.title}
                      </div>
                      <div className="text-sm text-gray-500 max-w-[120px]">
                        {item.subtitle}
                      </div>
                    </div>
                  )}

                  <div className="relative z-10">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF8533] flex items-center justify-center shadow-lg">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white flex items-center justify-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF8533] flex items-center justify-center">
                          <span className="text-white text-lg md:text-xl font-semibold">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {item.position === 'bottom' && (
                    <div className="mt-6 text-center">
                      <div className="text-xl md:text-2xl font-semibold text-[#FF6B00] mb-1">
                        {item.title}
                      </div>
                      <div className="text-sm text-gray-500 max-w-[120px]">
                        {item.subtitle}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="md:hidden grid grid-cols-2 gap-4">
            {achievements.map((item, index) => (
              <div key={index} className={`bg-gray-50 rounded-2xl p-6 text-center ${index === 4 ? 'col-span-2' : ''}`}>
                <div className="text-2xl font-semibold text-[#FF6B00] mb-1">
                  {item.title}
                </div>
                <div className="text-sm text-gray-500">
                  {item.subtitle}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`text-center mb-20 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-gray-900 tracking-tight mb-6">
            关于优加油
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
            优加油是一家专注于加油站领域的综合服务运营商，以其丰富的实操经验，致力于为加油站业主提供全方位的管理服务与战略合作解决方案。
          </p>
        </div>

        <div
          className={`text-center mb-24 transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-block">
            <p className="text-2xl md:text-3xl lg:text-4xl text-gray-900 font-medium tracking-tight">
              让管理加油站变轻松
            </p>
            <div className="h-1 w-24 md:w-32 bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent mx-auto mt-4" />
          </div>
        </div>
      </div>
    </section>
  );
}