'use client';

import { useState } from 'react';
import { Send, CheckCircle, ArrowRight } from 'lucide-react';

const serviceOptions = [
  '运营托管',
  '咨询顾问',
  '管理培训',
  '投资评估',
  '私域运营',
  '租赁经营',
  '投资收购',
  '其他服务',
];

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company: '',
    serviceType: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        setFormData({
          name: '',
          phone: '',
          company: '',
          serviceType: '',
          message: '',
        });
      } else {
        setError(result.error || '提交失败，请稍后重试');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 md:py-32 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight mb-6">
            联系我们
          </h2>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-light leading-relaxed">
            有任何问题或合作意向<br className="hidden md:block" />
            欢迎随时与我们联系
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm">
            {isSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h4 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight">
                  提交成功
                </h4>
                <p className="text-gray-500 mb-8">
                  我们会尽快与您联系，感谢您的关注
                </p>
                <button
                  onClick={() => setIsSuccess(false)}
                  className="text-gray-900 font-medium hover:text-[#FF6B00] transition-colors duration-300"
                >
                  继续留言 →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      您的姓名 <span className="text-[#FF6B00]">*</span>
                    </label>
                    <input
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="请输入姓名"
                      required
                      className="w-full h-14 px-5 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all duration-300 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      联系电话 <span className="text-[#FF6B00]">*</span>
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="请输入手机号"
                      required
                      className="w-full h-14 px-5 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all duration-300 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    公司/油站名称
                  </label>
                  <input
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="请输入公司或油站名称"
                    className="w-full h-14 px-5 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all duration-300 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    咨询业务类型
                  </label>
                  <select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    className="w-full h-14 px-5 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all duration-300 appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
                  >
                    <option value="">请选择业务类型</option>
                    {serviceOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    留言内容 <span className="text-[#FF6B00]">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="请详细描述您的需求或问题..."
                    required
                    rows={4}
                    className="w-full px-5 py-4 bg-gray-50 border-0 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all duration-300 resize-none placeholder:text-gray-400"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      提交中...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      提交留言
                      <Send className="w-4 h-4" />
                    </span>
                  )}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  提交即表示您同意我们的隐私政策，我们将保护您的个人信息
                </p>
              </form>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <a
              href="tel:18007313173"
              className="bg-white rounded-2xl p-6 hover:shadow-sm transition-shadow duration-300 group"
            >
              <div className="text-sm text-gray-400 mb-1">咨询电话</div>
              <div className="text-gray-900 font-medium group-hover:text-[#FF6B00] transition-colors duration-300 flex items-center gap-1">
                18007313173
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </div>
            </a>
            <div className="bg-white rounded-2xl p-6">
              <div className="text-sm text-gray-400 mb-1">公司地址</div>
              <div className="text-gray-900 font-medium">
                湖南长沙
              </div>
            </div>
            <a
              href="mailto:185695457@qq.com"
              className="bg-white rounded-2xl p-6 hover:shadow-sm transition-shadow duration-300 group"
            >
              <div className="text-sm text-gray-400 mb-1">电子邮箱</div>
              <div className="text-gray-900 font-medium group-hover:text-[#FF6B00] transition-colors duration-300 flex items-center gap-1">
                185695457@qq.com
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}