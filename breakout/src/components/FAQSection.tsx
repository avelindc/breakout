"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

type FAQSectionProps = {
  section: {
    badge: string;
    title: string;
    subtitle: string;
    isActive: boolean;
  };
  groups: {
    id: string;
    title: string;
    colorClass: "orange" | "green" | "blue" | "purple" | string;
    order: number;
    questions: {
      id: string;
      question: string;
      answer: string;
    }[];
  }[];
};

export default function FAQSection({ section, groups }: FAQSectionProps) {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  if (!section.isActive || !groups || groups.length === 0) return null;

  const toggle = (id: string) => {
    setOpenIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "orange": return "bg-[#FFF4ED]/10 border-[#FFE4D6]/20 text-[#FFD1B3]";
      case "green": return "bg-[#F2FCEE]/10 border-[#E2F7DA]/20 text-[#C6F6D5]";
      case "blue": return "bg-[#F0F4FF]/10 border-[#DCE4FF]/20 text-[#BFDBFE]";
      case "purple": return "bg-[#F5F3FF]/10 border-[#EDE9FE]/20 text-[#DDD6FE]";
      default: return "bg-white/5 border-white/10 text-gray-300";
    }
  };

  const getBadgeClasses = (color: string) => {
    switch (color) {
      case "orange": return "bg-[#E85D04] text-white shadow-sm";
      case "green": return "bg-[#A7F3D0] text-emerald-800 shadow-sm"; 
      case "blue": return "bg-[#64748B] text-white shadow-sm"; // Changed to gray-ish blue like in design
      default: return "bg-gray-300 text-gray-800 shadow-sm";
    }
  };

  return (
    <section id="faq" className="py-24 px-6 relative font-sans text-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-16 max-w-3xl">
          {section.badge && (
            <div className="inline-block px-4 py-1.5 bg-[#C6F6D5] text-[#22543D] text-sm font-bold rounded-full mb-6">
              {section.badge}
            </div>
          )}
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight text-white">
            {section.title}
          </h2>
          <p className="text-gray-300 text-lg md:text-xl">
            {section.subtitle}
          </p>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {[...groups].sort((a,b)=>a.order-b.order).map((group, index) => {
            const cardStyle = getColorClasses(group.colorClass);
            const badgeStyle = getBadgeClasses(group.colorClass);
            
            return (
              <div key={group.id} className={`rounded-[32px] p-6 md:p-8 border ${cardStyle} transition-all duration-300 shadow-sm hover:shadow-md`}>
                
                {/* Group Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${badgeStyle}`}>
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <h3 className="text-lg font-medium tracking-tight text-white">
                    {group.title}
                  </h3>
                </div>

                {/* Questions */}
                <div className="flex flex-col gap-3">
                  {group.questions.map((q) => {
                    const isOpen = openIds[q.id];
                    return (
                      <div key={q.id} className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-sm transition-all hover:bg-white/20">
                        <button 
                          onClick={() => toggle(q.id)}
                          className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 focus:outline-none"
                        >
                          <span className="font-semibold text-[13px] leading-snug text-white">{q.question}</span>
                          <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border transition-colors ${isOpen ? 'bg-white/20 border-white/30' : 'bg-white/5 border-white/10 hover:bg-white/20'}`}>
                            {isOpen ? <Minus className="w-3.5 h-3.5 text-white" /> : <Plus className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </button>
                        <div 
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                          <div className="px-5 pb-5 pt-0 text-[13px] text-gray-300 leading-relaxed">
                            {q.answer}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
