'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';

const teamMembers = [
  {
    name: '冯琦',
    position: '创始人 & CEO',
    experience: '10年+',
    expertise: '加油站营销与管理专家',
    credentials: ['南京大学优秀毕业生', '中南大学MBA', '人力资源管理师', '企业培训师'],
    bio: '拥有10年加油站行业高管经验，在中国民营连锁加油站唯一主板上市油企"和顺石油"历任营销总监、零售管理总经理、信息部总经理、项目投资开发负责人、广东公司总经理等职。',
    achievements: [
      '2015年加入和顺石油，帮助完成沪市主板上市',
      '帮助和顺石油完成信息化转型',
      '开拓第一个湖南省外区域市场广东市场',
      '2023年10月创立加油站新锐管理品牌"优加油"',
    ],
    image: '/assets/冯琦半身.jpg',
  },
  {
    name: '张振亮',
    position: '运营总监',
    experience: '资深油站管理专家',
    expertise: '新媒体及平台在油站的应用',
    credentials: ['中字头油企管理经验', '民营上市油企管理经验'],
    bio: '聚焦新媒体及平台在油站的应用，资深油站现场管理专家。拥有中字头与民营上市油企双重管理经验，对加油站运营管理有着深刻的理解和丰富的实战经验。',
    achievements: [
      '新媒体运营在油站场景的创新应用',
      '油站现场管理标准化体系搭建',
      '多平台合作运营经验丰富',
    ],
    image: '/assets/张振亮半身.jpg',
  },
  {
    name: '刘超山',
    position: '专业总监',
    experience: '10年+',
    expertise: '油站现场管理专家',
    credentials: ['上市油企区域经理', '分公司零管负责人'],
    bio: '油站现场管理专家，拥有10多年油站管理经验。在上市油企任区域经理、分公司零管负责人，对加油站现场运营管理有着丰富的实战经验和深厚的专业积累。',
    achievements: [
      '10余年加油站现场管理经验',
      '上市油企区域经理任职经历',
      '分公司零管管理经验丰富',
    ],
    image: '/assets/刘超山半身.jpg',
  },
  {
    name: '王志伟',
    position: '公共关系专家',
    experience: '资深站经理',
    expertise: '对外关系协调',
    credentials: ['上市油企主管', '站经理', '区域经理'],
    bio: '在上市油企从基层做起，历任主管、站经理、区域经理等职。拥有非常丰富的对外关系协调经验，在公共关系维护和对外合作方面有着深厚的积累。',
    achievements: [
      '上市油企从基层做起',
      '历任主管、站经理、区域经理',
      '丰富的对外关系协调经验',
    ],
    image: '/assets/王志伟半身.jpg',
  },
  {
    name: '莫家奋',
    position: '员工管理专家',
    experience: '资深站经理',
    expertise: '员工管理 & 大客户开发',
    credentials: ['多家知名油企管理经验', '基层管理经验丰富'],
    bio: '在多家知名油企从事管理工作，有丰富的基层管理经验和加油站大客户开发经验。对加油站人员管理和客户关系维护有着深入的理解和实践。',
    achievements: [
      '多家知名油企管理经验',
      '丰富的基层管理经验',
      '加油站大客户开发专家',
    ],
    image: '/assets/莫家奋半身.jpg',
  },
  {
    name: '李伟业',
    position: '大客户开发专家',
    experience: '资深站经理',
    expertise: '大客户开发',
    credentials: ['资深站经理', '大客户开发专家'],
    bio: '拥有丰富的加油站大客户开发经验，在客户关系维护和业务拓展方面有着深厚的积累。对加油站运营管理有着深入的理解和实践经验。',
    achievements: [
      '资深站经理',
      '大客户开发专家',
      '丰富的客户资源',
    ],
    image: '/assets/李伟业半身.jpg',
  },
  {
    name: '董录琪',
    position: '加油站销售专家',
    experience: '资深站经理',
    expertise: '加油站销售',
    credentials: ['资深站经理', '加油站销售专家'],
    bio: '拥有丰富的加油站销售实战经验，在销售技巧培训和团队管理方面有着深厚的积累。对加油站销售模式有着深入的理解和创新实践。',
    achievements: [
      '资深站经理',
      '加油站销售专家',
      '销售培训导师',
    ],
    image: '/assets/董录琪半身.jpg',
  },
];

export function TeamSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? teamMembers.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) =>
      prev === teamMembers.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <section id="team" className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight mb-6">
            团队介绍
          </h2>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-light leading-relaxed">
            核心团队由资深加油站行业专家组成<br className="hidden md:block" />
            拥有丰富的实战经验和卓越的专业能力
          </p>
        </div>

        <div className="mb-16 md:mb-20">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 p-8 md:p-16">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#FF6B00]/20 to-transparent" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-16">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4 tracking-tight">
                  专业、年轻、充满活力
                </h3>
                <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-lg">
                  优加油团队由一群热爱加油站行业的专业人士组成，我们既有深耕行业多年的资深专家，
                  也有充满创新精神的年轻力量。
                </p>
              </div>

              <div className="flex-shrink-0">
                <div className="w-64 h-40 md:w-80 md:h-52 rounded-2xl overflow-hidden shadow-xl border border-white/20">
                  <Image
                    src="/assets/团队照微笑_20260521140133143.jpg"
                    alt="优加油团队合影"
                    width={320}
                    height={208}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-8 text-center tracking-tight">
            核心成员
          </h3>

          <div className="md:hidden">
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center overflow-hidden rounded-2xl shadow-lg">
                {teamMembers[currentIndex].image ? (
                  <Image
                    src={teamMembers[currentIndex].image!}
                    alt={teamMembers[currentIndex].name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#FF6B00] to-[#FF8533] flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <h4 className="text-xl font-semibold text-gray-900 mb-1">
                  {teamMembers[currentIndex].name}
                </h4>
                <p className="text-[#FF6B00] text-sm mb-4">
                  {teamMembers[currentIndex].position}
                </p>

                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {teamMembers[currentIndex].credentials.map((cred, i) => (
                    <span key={i} className="px-2 py-1 bg-white rounded-full text-xs text-gray-600">
                      {cred}
                    </span>
                  ))}
                </div>

                <p className="text-sm text-gray-600 leading-relaxed mb-4 max-w-sm mx-auto">
                  {teamMembers[currentIndex].bio}
                </p>

                <div className="text-left max-w-sm mx-auto">
                  <div className="text-xs text-gray-400 mb-2">主要成就</div>
                  <ul className="space-y-1">
                    {teamMembers[currentIndex].achievements.map((achievement, i) => (
                      <li key={i} className="text-xs text-gray-500 flex items-start gap-2">
                        <span className="text-[#FF6B00] mt-1">•</span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={goToPrev}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-900 hover:text-gray-900 transition-colors duration-300"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex gap-2">
                  {teamMembers.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                        index === currentIndex ? 'bg-[#FF6B00]' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={goToNext}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-900 hover:text-gray-900 transition-colors duration-300"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="relative">
              <button
                onClick={goToPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 hover:border-gray-200 transition-all duration-300"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>

              <button
                onClick={goToNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 hover:border-gray-200 transition-all duration-300"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>

              <div className="bg-gray-50 rounded-3xl p-10 md:p-12 mx-8">
                <div className="flex items-start gap-8">
                  <div className="w-24 h-24 md:w-28 md:h-28 flex items-center justify-center flex-shrink-0 overflow-hidden rounded-2xl shadow-lg">
                    {teamMembers[currentIndex].image ? (
                      <Image
                        src={teamMembers[currentIndex].image}
                        alt={teamMembers[currentIndex].name}
                        width={112}
                        height={112}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#FF6B00] to-[#FF8533] flex items-center justify-center">
                        <User className="w-10 h-10 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-2xl font-semibold text-gray-900">
                        {teamMembers[currentIndex].name}
                      </h4>
                      <span className="text-[#FF6B00] text-base font-medium">
                        {teamMembers[currentIndex].position}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {teamMembers[currentIndex].credentials.map((cred, i) => (
                        <span key={i} className="px-3 py-1 bg-white rounded-full text-sm text-gray-600 shadow-sm">
                          {cred}
                        </span>
                      ))}
                    </div>

                    <p className="text-base text-gray-600 leading-relaxed mb-4">
                      {teamMembers[currentIndex].bio}
                    </p>

                    <div className="space-y-2">
                      <div className="text-sm text-gray-400 mb-2">主要成就</div>
                      {teamMembers[currentIndex].achievements.map((achievement, i) => (
                        <div key={i} className="text-sm text-gray-500 flex items-start gap-3">
                          <span className="text-[#FF6B00] mt-1">•</span>
                          <span>{achievement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center items-center gap-3 mt-8">
                  {teamMembers.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        index === currentIndex ? 'bg-[#FF6B00] scale-125' : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 md:mt-24 pt-16 border-t border-gray-100">
          <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 text-center mb-12">
            为什么选择优加油
          </h3>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-x-16 gap-y-8">
            {[
              {
                title: '专业团队',
                desc: '核心团队10年+，整体团队8年+的加油站运营管理经验',
              },
              {
                title: '全链服务',
                desc: '从油站投资评估，到建站过程的咨询服务，到运营过程的管理咨询、管理培训、人员输出、运营托管，到深度的租赁与资产投资全可一站搞定',
              },
              {
                title: '长期承诺',
                desc: '投资加油站资产，自营加油站项目，与行业共同成长',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 group"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] mt-2.5 flex-shrink-0 group-hover:scale-150 transition-transform duration-300" />
                <div>
                  <div className="text-lg font-medium text-gray-900 mb-1 group-hover:text-[#FF6B00] transition-colors duration-300">
                    {item.title}
                  </div>
                  <div className="text-gray-600 font-light">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}