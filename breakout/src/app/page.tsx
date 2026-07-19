import Link from "next/link";
import { AuroraBackground } from "@/components/AuroraBackground";
import * as LucideIcons from "lucide-react";
import { getLandingPageCMS } from "@/app/actions/cms";
import { Metadata } from "next";

// Helper for dynamic icons
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Star;
  return <IconComponent className={className} />;
};

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getLandingPageCMS();
  return {
    title: cms.seo.title,
    description: cms.seo.description,
    keywords: cms.seo.keywords,
  };
}

export default async function LandingPage() {
  const cms = await getLandingPageCMS();

  return (
    <main className="min-h-screen bg-[#09090B] text-white selection:bg-[#7000FF] selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Breakout Logo" className="h-12 w-auto" />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            {cms.about.isActive && <Link href="#about" className="hover:text-white transition">About</Link>}
            <Link href="#features" className="hover:text-white transition">Features</Link>
            <Link href="#pricing" className="hover:text-white transition">Pricing</Link>
            {cms.faq.length > 0 && <Link href="#faq" className="hover:text-white transition">FAQ</Link>}
            {cms.contact.isActive && <Link href="#contact" className="hover:text-white transition">Contact</Link>}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-white transition text-gray-300 hidden sm:block">Login</Link>
            <Link href={cms.hero.ctaLink} className="text-sm font-semibold bg-white text-black px-5 py-2.5 rounded-full hover:bg-gray-200 transition">{cms.hero.ctaText}</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <AuroraBackground>
        <div className="max-w-5xl mx-auto px-6 pt-32 pb-20 text-center flex flex-col items-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
            <span className="text-sm font-medium text-gray-300">{cms.hero.badge}</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 animate-slide-up leading-tight">
            {cms.hero.title1} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#0047FF] to-[#7000FF]">
              {cms.hero.title2}
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {cms.hero.subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Link href={cms.hero.ctaLink} className="px-8 py-4 rounded-full bg-gradient-to-r from-[#7000FF] to-[#0047FF] text-white font-semibold text-lg hover:opacity-90 transition shadow-[0_0_30px_rgba(112,0,255,0.4)]">
              {cms.hero.ctaText}
            </Link>
            {cms.hero.secondaryCtaText && (
              <Link href={cms.hero.secondaryCtaLink} className="px-8 py-4 rounded-full glass border border-white/10 text-white font-semibold text-lg hover:bg-white/5 transition flex items-center gap-2">
                <LucideIcons.PlayCircle className="w-5 h-5" /> {cms.hero.secondaryCtaText}
              </Link>
            )}
          </div>
        </div>

        {/* Dynamic Background Image if specified */}
        {cms.hero.backgroundUrl && (
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
             <img src={cms.hero.backgroundUrl} alt="Hero BG" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#09090B]"></div>
          </div>
        )}
      </AuroraBackground>
      
      {/* Partners Section */}
      {cms.partners.length > 0 && (
        <section className="py-10 border-b border-white/5 bg-[#09090B]">
          <div className="max-w-7xl mx-auto px-6 overflow-hidden">
            <p className="text-center text-sm text-gray-500 font-medium mb-8 uppercase tracking-wider">Trusted by industry leaders</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              {cms.partners.map(partner => (
                <img key={partner.id} src={partner.logoUrl} alt={partner.name} className="h-8 md:h-12 object-contain" title={partner.name} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      {cms.about.isActive && (
        <section id="about" className="py-24 px-6 bg-[#09090B] relative overflow-hidden">
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#7000FF] rounded-full blur-[150px] opacity-10 -translate-y-1/2 pointer-events-none"></div>
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 relative">
              {cms.about.imageUrl ? (
                <div className="relative rounded-3xl overflow-hidden glass border border-white/10 aspect-square md:aspect-[4/5] shadow-[0_0_50px_rgba(0,240,255,0.1)]">
                  <img src={cms.about.imageUrl} alt="About Us" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="relative rounded-3xl overflow-hidden glass border border-white/10 aspect-square md:aspect-[4/5] bg-gradient-to-br from-[#111] to-[#222] flex items-center justify-center shadow-[0_0_50px_rgba(0,240,255,0.1)]">
                  <LucideIcons.Music className="w-32 h-32 text-white/5" />
                </div>
              )}
            </div>
            <div className="order-1 md:order-2 space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{cms.about.title}</h2>
              <div className="h-1 w-20 bg-gradient-to-r from-[#00F0FF] to-[#7000FF] rounded-full"></div>
              <p className="text-gray-400 text-lg leading-relaxed whitespace-pre-wrap">
                {cms.about.description}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      {cms.features.length > 0 && (
        <section id="features" className="py-24 px-6 bg-[#09090B] border-t border-white/5 relative overflow-hidden">
           <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#00F0FF] rounded-full blur-[150px] opacity-10 pointer-events-none"></div>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Everything you need to <span className="text-[#00F0FF]">succeed</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {cms.features.map((feature, idx) => (
                <div key={feature.id} className="glass-card p-8 flex flex-col items-start gap-4 group hover:border-white/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(112,0,255,0.15)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center relative z-10 ${
                    idx % 3 === 0 ? 'bg-[#7000FF]/20 text-[#7000FF]' : 
                    idx % 3 === 1 ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 
                    'bg-blue-500/20 text-blue-500'
                  }`}>
                    <DynamicIcon name={feature.icon} className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold relative z-10">{feature.title}</h3>
                  <p className="text-gray-400 relative z-10">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      {cms.pricing.length > 0 && (
        <section id="pricing" className="py-24 px-6 bg-black relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Simple, Transparent Pricing</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">Choose the plan that best fits your needs. No hidden fees.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              {cms.pricing.map(plan => (
                <div key={plan.id} className={`glass-card p-8 rounded-3xl w-full max-w-sm flex flex-col relative transition-transform hover:-translate-y-2 ${plan.isPopular ? 'border-[#7000FF]/50 shadow-[0_0_30px_rgba(112,0,255,0.2)]' : 'border-white/10'}`}>
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#7000FF] to-[#00F0FF] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                  <div className="space-y-4 flex-1 mb-8">
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <LucideIcons.CheckCircle2 className="w-5 h-5 text-[#00F0FF] shrink-0" />
                        <span className="text-gray-300">{feat}</span>
                      </div>
                    ))}
                  </div>
                  <Link href={plan.ctaLink} className={`w-full py-4 rounded-xl font-bold text-center transition-all ${plan.isPopular ? 'bg-white text-black hover:bg-gray-200' : 'glass border border-white/20 text-white hover:bg-white/10'}`}>
                    {plan.ctaText}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {cms.testimonials.length > 0 && (
        <section className="py-24 px-6 bg-[#09090B]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-16 text-center">Loved by Artists</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cms.testimonials.map(testi => (
                <div key={testi.id} className="glass p-6 rounded-2xl border border-white/5 hover:border-white/10 transition flex flex-col justify-between">
                  <div>
                    <div className="flex gap-1 text-[#00F0FF] mb-4">
                      {[...Array(5)].map((_, i) => <LucideIcons.Star key={i} className="w-4 h-4 fill-current" />)}
                    </div>
                    <p className="text-gray-300 italic mb-6">"{testi.content}"</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <img src={testi.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${testi.name}`} alt={testi.name} className="w-12 h-12 rounded-full object-cover bg-white/5" />
                    <div>
                      <h4 className="font-bold">{testi.name}</h4>
                      <p className="text-xs text-gray-500">{testi.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {cms.faq.length > 0 && (
        <section id="faq" className="py-24 px-6 bg-black border-y border-white/5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {cms.faq.map(faq => (
                <details key={faq.id} className="group glass border border-white/5 rounded-2xl [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between p-6 cursor-pointer font-semibold text-lg select-none">
                    {faq.question}
                    <span className="transition group-open:rotate-180">
                      <LucideIcons.ChevronDown className="w-5 h-5 text-gray-400" />
                    </span>
                  </summary>
                  <div className="px-6 pb-6 text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {cms.contact.isActive && (
        <section id="contact" className="py-24 px-6 bg-[#09090B]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-8">Get in Touch</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <a href={`mailto:${cms.contact.email}`} className="glass px-8 py-6 rounded-2xl border border-white/5 hover:border-[#00F0FF]/50 transition group flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#00F0FF]/10 flex items-center justify-center mb-4 text-[#00F0FF] group-hover:scale-110 transition">
                  <LucideIcons.Mail className="w-6 h-6" />
                </div>
                <h3 className="font-bold mb-1">Email Us</h3>
                <p className="text-gray-400 text-sm">{cms.contact.email}</p>
              </a>
              <a href={`https://wa.me/${cms.contact.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="glass px-8 py-6 rounded-2xl border border-white/5 hover:border-[#7000FF]/50 transition group flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#7000FF]/10 flex items-center justify-center mb-4 text-[#7000FF] group-hover:scale-110 transition">
                  <LucideIcons.MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="font-bold mb-1">WhatsApp</h3>
                <p className="text-gray-400 text-sm">{cms.contact.whatsapp}</p>
              </a>
              <div className="glass px-8 py-6 rounded-2xl border border-white/5 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 text-gray-300">
                  <LucideIcons.MapPin className="w-6 h-6" />
                </div>
                <h3 className="font-bold mb-1">Office</h3>
                <p className="text-gray-400 text-sm">{cms.contact.address}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-6 bg-black border-t border-white/5 text-center md:text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-4">
            <img src="/logo.png" alt="Breakout Logo" className="h-8 w-auto grayscale opacity-70" />
            <p className="text-gray-500 text-sm max-w-xs">{cms.footer.aboutText}</p>
          </div>
          <div className="text-gray-600 text-sm font-medium">
            {cms.footer.copyright}
          </div>
        </div>
      </footer>
    </main>
  );
}
