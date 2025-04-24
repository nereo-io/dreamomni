"use client";

import { IChingNoticeSection } from "@/types/pages/i-ching";

export default function NoticeSection({ t }: { t: IChingNoticeSection }) {
  return (
    <section className="py-12 bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] to-[#8A2BE2] opacity-5 mix-blend-multiply"></div>
      </div>

      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {t.title}
          </h3>
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#8A2BE2] text-white font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {t.items[0].title}
                  </p>
                  <p className="text-gray-600 mt-1">{t.items[0].description}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#8A2BE2] text-white font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {t.items[1].title}
                  </p>
                  <p className="text-gray-600 mt-1">{t.items[1].description}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#8A2BE2] text-white font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {t.items[2].title}
                  </p>
                  <p className="text-gray-600 mt-1">{t.items[2].description}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#8A2BE2] text-white font-bold">
                  4
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {t.items[3].title}
                  </p>
                  <p className="text-gray-600 mt-1">{t.items[3].description}</p>

                  <div className="mt-4 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      {t.examples.title}
                    </p>
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl shadow-sm text-sm">
                        <p className="font-medium text-[#8A2BE2] mb-2">
                          {t.examples.items[0].title}
                        </p>
                        <p className="text-gray-700">
                          {t.examples.items[0].content}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-xl shadow-sm text-sm">
                        <p className="font-medium text-[#8A2BE2] mb-2">
                          {t.examples.items[1].title}
                        </p>
                        <p className="text-gray-700">
                          {t.examples.items[1].content}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-xl shadow-sm text-sm">
                        <p className="font-medium text-[#8A2BE2] mb-2">
                          {t.examples.items[2].title}
                        </p>
                        <p className="text-gray-700">
                          {t.examples.items[2].content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
            <div className="mt-8 pt-4 border-t border-gray-200 text-sm text-center text-gray-500">
              {t.contact.prefix}{" "}
              <a
                href={`mailto:${t.contact.email}`}
                className="text-[#8A2BE2] hover:underline font-medium"
              >
                {t.contact.email}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
