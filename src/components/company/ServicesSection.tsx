'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Lightbulb,
  GraduationCap,
  Calculator,
  Users,
  Building2,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';

const managementServices = [
  {
    id: 'trusteeship',
    icon: Settings,
    title: '运营托管',
    description: '业主保留资产所有权，优加油提供全方位运营托管服务，让业主省心省力，轻松收益。',
    highlights: ['日常运营', '安全管理', '营销策划', '服务与卫生', '人员管理'],
  },
  {
    id: 'consulting',
    icon: Lightbulb,
    title: '咨询顾问',
    description: '为加油站企业提供专业的管理诊断与优化方案，解决运营中的各类管理难题。',
    highlights: ['营销策划', '薪酬设计', '数据分析', '会员运营', '税务筹划'],
  },
  {
    id: 'training',
    icon: GraduationCap,
    title: '管理培训',
    description: '为加油站培养和输送专业管理人才，提供系统化的培训课程与人才匹配服务。',
    highlights: ['管理人员综合能力培训', '新员工岗前培训', '营销活动专项培训等'],
  },
  {
    id: 'evaluation',
    icon: Calculator,
    title: '投资评估',
    description: '为加油站投资者提供专业的项目可行性分析与价值评估服务，降低投资风险。',
    highlights: ['市场调研', '投资测算', '风险评估'],
  },
  {
    id: 'private-domain',
    icon: Users,
    title: '私域运营',
    description: '帮助加油站构建私域流量池，提升客户粘性和复购率，实现精准营销。',
    highlights: ['会员体系搭建', '社群运营', '精准营销', '客户关系管理'],
  },
];

const strategicServices = [
  {
    id: 'lease',
    icon: Building2,
    title: '租赁经营',
    description: '优加油租赁合适的加油站，以自有品牌"优加油"独立运营。通过自营油站试点创新、积累经验，将行之有效的方法赋能行业。',
    highlights: ['自有品牌运营', '创新业务试点', '成功经验输出', '实战验证方案'],
    badge: '自营品牌',
  },
  {
    id: 'investment',
    icon: TrendingUp,
    title: '投资收购',
    description: '优加油收购合适的加油站资产，长期持有并自主运营。这体现了我们对行业发展的坚定信心，我们将长期伴随行业成长。',
    highlights: ['资产收购', '长期持有', '行业信心', '推动进步'],
    badge: '长期承诺',
  },
];

export function ServicesSection() {
  const [activeService, setActiveService] = useState(managementServices[0]);
  const [activeStrategy, setActiveStrategy] = useState(strategicServices[0]);
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

  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="services"
      className="py-24 md:py-32 bg-gray-50 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div
          className={`text-center mb-20 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-gray-900 tracking-tight mb-6">
            业务介绍
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto font-light">
            从管理服务到战略合作，为加油站提供全生命周期解决方案
          </p>
        </div>

        <div
          className={`grid lg:grid-cols-2 gap-16 lg:gap-24 transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div>
            <div className="mb-8">
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
                管理服务
              </h3>
              <p className="text-gray-500 font-light">专业运营，为您创造价值</p>
              <div className="h-0.5 w-12 bg-[#FF6B00] mt-4" />
            </div>

            <div className="space-y-3 mb-8">
              {managementServices.map((service) => {
                const Icon = service.icon;
                const isActive = activeService.id === service.id;
                return (
                  <button
                    key={service.id}
                    onClick={() => setActiveService(service)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-white shadow-lg shadow-gray-200/50'
                        : 'bg-white/50 hover:bg-white hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                          isActive ? 'bg-[#FF6B00] text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`font-medium transition-colors duration-300 ${
                          isActive ? 'text-gray-900' : 'text-gray-600'
                        }`}
                      >
                        {service.title}
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 ml-auto transition-all duration-300 ${
                          isActive
                            ? 'text-[#FF6B00] opacity-100'
                            : 'text-gray-400 opacity-0'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                {activeService.title}
              </h4>
              <p className="text-gray-600 mb-6 font-light leading-relaxed">
                {activeService.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {activeService.highlights.map((highlight, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-8">
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
                战略合作
              </h3>
              <p className="text-gray-500 font-light">深度绑定，与您共同成长</p>
              <div className="h-0.5 w-12 bg-[#FF6B00] mt-4" />
            </div>

            <div className="space-y-6">
              {strategicServices.map((service) => {
                const Icon = service.icon;
                const isActive = activeStrategy.id === service.id;
                return (
                  <div
                    key={service.id}
                    onClick={() => setActiveStrategy(service)}
                    className={`bg-white rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                      isActive
                        ? 'shadow-xl shadow-gray-200/50 ring-1 ring-[#FF6B00]/20'
                        : 'shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                          isActive ? 'bg-[#FF6B00] text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-xl font-semibold text-gray-900">
                            {service.title}
                          </h4>
                          {service.badge && (
                            <span className="px-2 py-0.5 bg-[#FF6B00]/10 text-[#FF6B00] text-xs font-medium rounded-full">
                              {service.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 font-light leading-relaxed mb-4">
                          {service.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {service.highlights.map((highlight, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gray-50 text-gray-700 rounded-lg text-sm"
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl text-white">
              <h4 className="text-xl font-semibold mb-2">
                寻找战略合作伙伴
              </h4>
              <p className="text-gray-300 font-light mb-4">
                如果您有优质的加油站资源，欢迎与我们洽谈合作
              </p>
              <button
                onClick={scrollToContact}
                className="inline-flex items-center gap-2 text-[#FF6B00] font-medium hover:gap-3 transition-all duration-300"
              >
                立即咨询
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div
          className={`text-center mt-20 pt-16 border-t border-gray-200 transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="text-gray-500 mb-6 font-light">
            每一项服务都经过我们自营油站的实战验证
          </p>
          <button
            onClick={scrollToContact}
            className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#E55D00] text-white px-8 py-4 rounded-full font-medium transition-all duration-300 hover:shadow-lg hover:shadow-orange-200"
          >
            获取定制方案
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}