import Link from "next/link";
import { AuroraBackground } from "@/components/AuroraBackground";
import * as LucideIcons from "lucide-react";
import { getLandingPageCMS } from "@/app/actions/cms";
import { getLandingStats } from "@/app/actions/landingStats";
import { Metadata } from "next";
import { AnimatedSection, AnimatedCounter, Navbar, FeaturedReleaseCard } from "./LandingClient";
import FAQSection from "@/components/FAQSection";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  const dbStats = await getLandingStats();

  const totalArtists = cms.stats.autoFromDb ? dbStats.artistCount : (cms.stats.totalArtists || 0);
  const totalReleases = cms.stats.autoFromDb ? dbStats.releaseCount : (cms.stats.totalReleases || 0);
  const totalStreams = cms.stats.autoFromDb ? dbStats.streamCount : (cms.stats.totalStreams || 0);

  const bgStyle = cms.design?.backgroundType === "color" && cms.design.backgroundColor 
    ? { backgroundColor: cms.design.backgroundColor } 
    : {};
  const bgClass = (!cms.design?.backgroundType || cms.design?.backgroundType === "aurora") ? "bg-[#0B0F1A]" : "bg-black/90";

  function getYouTubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url?.match(regExp);
    return match && match[2].length === 11 ? match[2] : "";
  }

  const HeroWrapper = (!cms.design?.backgroundType || cms.design?.backgroundType === "aurora") ? AuroraBackground : "div";

  return (
    <main className={`min-h-screen text-white selection:bg-[#7000FF] selection:text-white pb-20 relative overflow-hidden ${bgClass}`} style={bgStyle}>
      
      {cms.design?.backgroundType === "image" && cms.design.backgroundImage && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img src={cms.design.backgroundImage} className="w-full h-full object-cover opacity-40" alt="Background" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
        </div>
      )}

      {cms.design?.backgroundType === "video" && cms.design.backgroundVideo && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {cms.design.backgroundVideo.includes("youtube") || cms.design.backgroundVideo.includes("youtu.be") ? (
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeId(cms.design.backgroundVideo)}?autoplay=1&mute=1&loop=1&playlist=${getYouTubeId(cms.design.backgroundVideo)}&controls=0&showinfo=0&rel=0`}
              className="absolute w-[300%] h-[300%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-cover aspect-video opacity-30"
              allow="autoplay; encrypted-media"
            />
          ) : (
            <video src={cms.design.backgroundVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
        </div>
      )}

      <Navbar cms={cms} />

      {/* Hero Section */}
      <HeroWrapper className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 pt-40 pb-20 flex flex-col md:flex-row items-center relative z-10 min-h-[90vh]">
          
          <div className="w-full md:w-1/2 md:pr-10 z-20">
            <AnimatedSection>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                {cms.hero.title1} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#0047FF] to-[#7000FF]">
                  {cms.hero.title2}
                </span>
              </h1>
            </AnimatedSection>
            
            <AnimatedSection delay={0.2}>
              <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-xl">
                {cms.hero.subtitle}
              </p>
            </AnimatedSection>
            
            <AnimatedSection delay={0.4}>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link href={cms.hero.ctaLink} className="w-full sm:w-auto text-center px-8 py-4 rounded-full bg-gradient-to-r from-[#7000FF] to-[#0047FF] text-white font-bold text-lg hover:opacity-90 transition shadow-[0_0_30px_rgba(112,0,255,0.4)]">
                  {cms.hero.ctaText}
                </Link>
                {cms.hero.secondaryCtaText && (
                  <Link href={cms.hero.secondaryCtaLink} className="w-full sm:w-auto text-center px-8 py-4 rounded-full glass border border-white/10 text-white font-bold text-lg hover:bg-white/5 transition flex items-center justify-center gap-2">
                    <LucideIcons.Upload className="w-5 h-5" /> {cms.hero.secondaryCtaText}
                  </Link>
                )}
              </div>
            </AnimatedSection>
            
            <AnimatedSection delay={0.6}>
              <div className="mt-12 flex gap-8">
                <div>
                  <div className="text-3xl font-black text-white"><AnimatedCounter value={totalArtists} />+</div>
                  <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Exclusive Singers</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white"><AnimatedCounter value={totalReleases} />+</div>
                  <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Total Releases</div>
                </div>
              </div>
            </AnimatedSection>
          </div>

          <div className="w-full md:w-1/2 mt-16 md:mt-0 relative z-20">
            <AnimatedSection delay={0.3} className="relative">
              {cms.hero.backgroundUrl ? (
                 <div className="relative w-full aspect-[4/5] md:aspect-square rounded-[3rem] overflow-hidden glass border border-white/10 shadow-[0_0_80px_rgba(112,0,255,0.2)]">
                   <img src={cms.hero.backgroundUrl} alt="Hero Image" className="w-full h-full object-cover" />
                 </div>
              ) : (
                <div className="relative w-full aspect-[4/5] md:aspect-square rounded-[3rem] overflow-hidden glass border border-white/10 shadow-[0_0_80px_rgba(112,0,255,0.2)] flex items-center justify-center">
                  <LucideIcons.Music className="w-32 h-32 text-white/5" />
                </div>
              )}
            </AnimatedSection>
          </div>
          
        </div>
      </HeroWrapper>

      {/* Featured Releases Section */}
      {cms.featuredReleases.length > 0 && (
        <section id="releases" className="py-24 px-6 relative">
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-[#7000FF] rounded-full blur-[200px] opacity-10 pointer-events-none" />
          <div className="max-w-7xl mx-auto relative z-10">
            <AnimatedSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">This Week's Fire Tracks</h2>
                <p className="text-gray-400 text-lg">Discover the tracks everyone's talking about.</p>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cms.featuredReleases.sort((a,b)=>a.order-b.order).map((release, i) => (
                <AnimatedSection key={release.id} delay={i * 0.1}>
                  <FeaturedReleaseCard release={release} />
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Artists Section */}
      {cms.featuredArtists.length > 0 && (
        <section id="artists" className="py-24 px-6 bg-[#06080F] relative">
          <div className="max-w-7xl mx-auto relative z-10">
            <AnimatedSection>
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Our Talents</h2>
                  <p className="text-gray-400 text-lg">Meet the artists shaping the future of music.</p>
                </div>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {cms.featuredArtists.sort((a,b)=>a.order-b.order).map((artist, i) => (
                <AnimatedSection key={artist.id} delay={i * 0.1}>
                  <div className="glass-card rounded-3xl overflow-hidden group">
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <img src={artist.photo} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A]/50 to-transparent" />
                      <div className="absolute bottom-0 left-0 w-full p-6">
                        <span className="text-[#00F0FF] text-xs font-bold uppercase tracking-wider mb-2 block">{artist.genre}</span>
                        <h3 className="text-2xl font-bold text-white mb-2">{artist.name}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2 mb-4">{artist.bio}</p>
                        <div className="flex gap-4">
                          {artist.instagram && <a href={artist.instagram} target="_blank" rel="noreferrer" className="text-white hover:text-[#00F0FF] transition"><LucideIcons.Camera className="w-5 h-5" /></a>}
                          {artist.spotify && <a href={artist.spotify} target="_blank" rel="noreferrer" className="text-white hover:text-[#1DB954] transition"><LucideIcons.Headphones className="w-5 h-5" /></a>}
                          {artist.youtube && <a href={artist.youtube} target="_blank" rel="noreferrer" className="text-white hover:text-[#FF0000] transition"><LucideIcons.PlayCircle className="w-5 h-5" /></a>}
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Music Videos Section */}
      {cms.musicVideos.length > 0 && (
        <section id="videos" className="py-24 px-6 relative">
          <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-[#0047FF] rounded-full blur-[200px] opacity-10 pointer-events-none" />
          <div className="max-w-7xl mx-auto relative z-10">
            <AnimatedSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Latest Music Videos</h2>
                <p className="text-gray-400 text-lg">Watch the visual experience of our releases.</p>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cms.musicVideos.sort((a,b)=>a.order-b.order).map((video, i) => (
                <AnimatedSection key={video.id} delay={i * 0.1}>
                  <FeaturedReleaseCard 
                    release={{
                      id: video.id,
                      title: video.title,
                      artist: video.artist,
                      coverUrl: video.thumbnailUrl,
                      playerType: "youtube",
                      playerUrl: video.youtubeUrl
                    }} 
                  />
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      {cms.aboutLabel.isActive && (
        <section id="about" className="py-24 px-6 relative">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00F0FF] rounded-full blur-[250px] opacity-10 pointer-events-none" />
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
            <AnimatedSection className="w-full lg:w-1/2">
              <div className="relative aspect-square rounded-[3rem] overflow-hidden glass border border-white/10 shadow-[0_0_50px_rgba(0,240,255,0.1)]">
                {cms.aboutLabel.imageUrl ? (
                  <img src={cms.aboutLabel.imageUrl} alt="About Us" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#111]">
                    <LucideIcons.Info className="w-20 h-20 text-white/10" />
                  </div>
                )}
              </div>
            </AnimatedSection>
            
            <AnimatedSection className="w-full lg:w-1/2 space-y-8" delay={0.2}>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">{cms.aboutLabel.title}</h2>
              <div className="h-1 w-24 bg-gradient-to-r from-[#00F0FF] to-[#7000FF] rounded-full"></div>
              
              <p className="text-gray-300 text-lg leading-relaxed">
                {cms.aboutLabel.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                <div>
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <LucideIcons.Eye className="text-[#00F0FF]" /> Vision
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{cms.aboutLabel.vision}</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <LucideIcons.Target className="text-[#7000FF]" /> Mission
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{cms.aboutLabel.mission}</p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <FAQSection section={cms.faqSection} groups={cms.faqGroups} />

      {/* Testimonials Section */}
      {cms.testimonials && cms.testimonials.length > 0 && (
        <section id="testimonials" className="py-24 px-6 bg-[#06080F] relative">
          <div className="max-w-7xl mx-auto relative z-10">
            <AnimatedSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">What They Say</h2>
                <p className="text-gray-400 text-lg">Testimonials from our talented artists and partners.</p>
              </div>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cms.testimonials.map((testi, i) => (
                <AnimatedSection key={testi.id} delay={i * 0.1}>
                  <div className="glass-card rounded-3xl p-8 relative h-full">
                    <LucideIcons.Quote className="absolute top-6 right-6 w-10 h-10 text-white/5" />
                    <p className="text-gray-300 italic mb-6">"{testi.content}"</p>
                    <div className="flex items-center gap-4 mt-auto">
                      {testi.avatarUrl ? (
                        <img src={testi.avatarUrl} alt={testi.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                          <LucideIcons.User className="w-6 h-6 text-white/50" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-white">{testi.name}</h4>
                        <p className="text-xs text-[#00F0FF]">{testi.role}</p>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Partners Section */}
      {cms.partners && cms.partners.length > 0 && (
        <section id="partners" className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto relative z-10">
            <AnimatedSection>
              <div className="text-center mb-12">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Our Partners</h2>
              </div>
            </AnimatedSection>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70">
              {cms.partners.map((partner, i) => (
                <AnimatedSection key={partner.id} delay={i * 0.1}>
                  <div className="w-32 md:w-48 h-16 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-500 opacity-70 hover:opacity-100">
                    <img src={partner.logoUrl} alt={partner.name} className="max-w-full max-h-full object-contain" />
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-24 border-t border-white/10 pt-16 pb-8 px-6 bg-[#06080F]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <img src="/logo.png" alt="Breakout Logo" className="h-10 w-auto mb-6 opacity-80" />
              <p className="text-gray-400 max-w-sm mb-8">{cms.footer.aboutText}</p>
              
              <div className="flex gap-4">
                {cms.socialMedia.instagram && (
                  <a href={cms.socialMedia.instagram} target="_blank" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition">
                    <LucideIcons.Camera className="w-5 h-5 text-gray-300" />
                  </a>
                )}
                {cms.socialMedia.tiktok && (
                  <a href={cms.socialMedia.tiktok} target="_blank" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition">
                    <LucideIcons.Music2 className="w-5 h-5 text-gray-300" />
                  </a>
                )}
                {cms.socialMedia.youtube && (
                  <a href={cms.socialMedia.youtube} target="_blank" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition">
                    <LucideIcons.PlayCircle className="w-5 h-5 text-gray-300" />
                  </a>
                )}
                {cms.socialMedia.spotify && (
                  <a href={cms.socialMedia.spotify} target="_blank" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition">
                    <LucideIcons.Headphones className="w-5 h-5 text-gray-300" />
                  </a>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6">Contact Us</h4>
              <ul className="space-y-4">
                {cms.socialMedia.email && (
                  <li>
                    <a href={`mailto:${cms.socialMedia.email}`} className="text-gray-400 hover:text-white transition flex items-center gap-3">
                      <LucideIcons.Mail className="w-4 h-4 text-[#00F0FF]" /> {cms.socialMedia.email}
                    </a>
                  </li>
                )}
                {cms.socialMedia.whatsapp && (
                  <li>
                    <a href={`https://wa.me/${cms.socialMedia.whatsapp.replace(/[^0-9]/g, '')}`} className="text-gray-400 hover:text-white transition flex items-center gap-3">
                      <LucideIcons.MessageCircle className="w-4 h-4 text-[#25D366]" /> {cms.socialMedia.whatsapp}
                    </a>
                  </li>
                )}
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6">Legal</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/5 pt-8 flex flex-col items-center justify-center text-center">
            <p className="text-gray-600 text-sm">{cms.footer.copyright}</p>
          </div>
        </div>
      </footer>
      
    </main>
  );
}
