import { Link } from 'react-router-dom'
import {
  Wrench,
  MapPin,
  MessageCircle,
  Star,
  ShieldCheck,
  Timer,
  ArrowRight,
  Smartphone,
  ChevronDown,
  Sparkles,
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Stars } from '@/components/stars'
import { CategoryIcon } from '@/components/category-icon'
import { CATEGORY_LIST } from '@/lib/types'

const steps = [
  {
    icon: MessageCircle,
    title: 'Describe what broke',
    body: 'Pick a category, add a photo and your location. No bidding, no calls to five different people.',
  },
  {
    icon: Star,
    title: 'Pick the best-rated pro',
    body: 'We show nearby workers sorted by rating — you choose who to request, then hear back in real time.',
  },
  {
    icon: Wrench,
    title: 'Job accepted, hand off to WhatsApp',
    body: 'Your worker’s number, a ready-made message, and your map link are one tap away in WhatsApp.',
  },
]

const customerCategories = CATEGORY_LIST.slice(0, 6)

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={30} />
          <span className="font-display text-xl font-semibold tracking-tight">
            Geo<span className="text-primary">Fix</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#for-customers" className="transition-colors hover:text-foreground">For customers</a>
          <a href="#for-workers" className="transition-colors hover:text-foreground">For workers</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="geo-grid relative overflow-hidden">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <div className="animate-in">
          <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5" /> Madurai's #1 Local Service Network
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Madurai's Top-Rated <span className="text-primary">Repair Experts. Right Nearby.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Top-rated plumbers, electricians & technicians across Madurai. Instant WhatsApp connect.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" className="gap-2" asChild>
              <Link to="/signup">
                I need a repair <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link to="/signup?role=worker">
                I’m a professional <Wrench className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Stars value={4.8} size={15} /> 4.8 avg worker rating
            </span>
            <span className="flex items-center gap-2">
              <Timer className="h-4 w-4" /> ~4 min avg response
            </span>
          </div>
        </div>

        {/* Hero visual — a tasteful "app in the browser" mock */}
        <div className="animate-in relative" style={{ animationDelay: '120ms' }}>
          <div className="paper-card relative z-10 rotate-1 overflow-hidden p-0 shadow-xl">
            <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">geofix.app/customer</span>
            </div>
            <div className="space-y-3 p-5">
              <div>
                <span className="eyebrow">What’s broken?</span>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {customerCategories.map((c) => (
                    <div
                      key={c}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background/60 px-2 py-3 text-center"
                    >
                      <CategoryIcon category={c} className="h-4 w-4 text-primary" />
                      <span className="text-[11px] font-medium leading-tight">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                    Verified Pros in Madurai
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-medium">
                    <MapPin className="h-3 w-3 text-primary" /> 0.8 km
                  </span>
                </div>
                <div className="mt-2 space-y-2">
                  {[
                    { n: 'Rajan Kumar', r: 4.9, t: 'Plumbing' },
                    { n: 'Yusuf Idris', r: 4.8, t: 'Electrical' },
                    { n: 'Miguel Santos', r: 4.7, t: 'Painting' },
                  ].map((w) => (
                    <div key={w.n} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold">{w.n}</p>
                        <p className="text-[11px] text-muted-foreground">{w.t}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Stars value={w.r} size={13} />
                        <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
                          Request
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="paper-card absolute -bottom-6 -left-6 z-0 -rotate-3 p-3 opacity-90">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
                <MessageCircle className="h-4 w-4" />
              </span>
              <div>
                <p className="font-mono text-[11px] font-semibold">WhatsApp handoff ready</p>
                <p className="text-[11px] text-muted-foreground">Message + map link pre-filled</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-10 pb-10 text-center">
        <a href="#how" className="inline-flex flex-col items-center gap-1 text-xs text-muted-foreground">
          <ChevronDown className="h-4 w-4" /> How it works
        </a>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">The flow</span>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Fast repairs in Madurai in 3 easy steps
        </h2>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="paper-card paper-card-hover relative p-6">
            <span className="stat-number absolute right-5 top-4 text-4xl font-bold text-primary/15">0{i + 1}</span>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
              <s.icon className="h-5 w-5 stroke-[1.6]" />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ForCustomers() {
  return (
    <section id="for-customers" className="border-y border-border/70 bg-secondary/30">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <div>
          <span className="eyebrow">For customers</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
            Trusted Repairs Across Madurai, Guaranteed.
          </h2>
          <ul className="mt-6 space-y-4">
            {[
              ['Rating-first matching', 'Workers are shown best-rated first, so a weak rating doesn’t hide behind “available now”.'],
              ['Live, no-refresh updates', 'Accept, reject, and arrival states stream in as they happen.'],
              ['Your safety net', 'Every worker is ID-verified by the GeoFix team before they get approved.'],
              ['WhatsApp-native comms', 'No new chat app to learn. Coordinates and a ready message go straight to WhatsApp.'],
            ].map(([t, b]) => (
              <li key={t} className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-sm text-muted-foreground">{b}</p>
                </div>
              </li>
            ))}
          </ul>
          <Button className="mt-8 gap-2" size="lg" asChild>
            <Link to="/signup">Request a repair <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="geo-dots rounded-3xl border border-border bg-foreground/[0.03] p-8">
          <div className="paper-card p-6">
            <p className="text-sm italic text-muted-foreground">
              “Roof leak at 7pm, fixed by 9. The worker showed his verified ID before he started. I’ve stopped
              cold-calling repair shops.”
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-display text-sm font-bold text-primary">
                AP
              </span>
              <div>
                <p className="text-sm font-semibold">Aisha Patel</p>
                <Stars value={5} size={13} />
              </div>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Trusted by home owners for plumbing, electrical, carpentry & more
          </p>
        </div>
      </div>
    </section>
  )
}

function ForWorkers() {
  return (
    <section id="for-workers" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <span className="eyebrow">For workers</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
          Earn More as a Top Technician in Madurai
        </h2>
        <p className="mt-4 text-muted-foreground">
          Go online, be discovered by nearby customers, and keep doing what you’re good at. No bidding wars, no job-board
          fees.
        </p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ['One-tap online/offline', 'Control exactly when you want to take work.'],
          ['Real-time job alerts', 'Accept or reject instantly — customers see it live.'],
          ['Ratings work for you', 'Deliver great work, and your rating grows into a moat.'],
        ].map(([t, b]) => (
          <div key={t} className="paper-card paper-card-hover p-5">
            <h3 className="font-display text-base font-semibold">{t}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{b}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Button size="lg" variant="outline" className="gap-2" asChild>
          <Link to="/signup?role=worker">Join as a professional <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>
    </section>
  )
}

function DownloadBand() {
  return (
    <section className="border-t border-border/70 bg-foreground text-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">On the go? Take GeoFix with you</h2>
        <p className="max-w-xl text-background/60">
          The website and the mobile app share one account and one live feed — start a request on your phone, follow it
          on the website, or the other way around.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="#"
            className="flex items-center gap-3 rounded-xl border border-background/25 bg-background/10 px-5 py-3 transition-colors hover:bg-background/20"
          >
            <Smartphone className="h-6 w-6" />
            <div className="text-left">
              <p className="text-[11px] uppercase tracking-wide opacity-70">Download on the</p>
              <p className="font-display text-sm font-semibold">App Store</p>
            </div>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 rounded-xl border border-background/25 bg-background/10 px-5 py-3 transition-colors hover:bg-background/20"
          >
            <Smartphone className="h-6 w-6" />
            <div className="text-left">
              <p className="text-[11px] uppercase tracking-wide opacity-70">Get it on</p>
              <p className="font-display text-sm font-semibold">Google Play</p>
            </div>
          </a>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border/70 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Logo size={26} />
          <span className="font-display text-base font-semibold">
            Geo<span className="text-primary">Fix</span>
          </span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <Link to="/login" className="hover:text-foreground">Log in</Link>
          <Link to="/signup" className="hover:text-foreground">Sign up</Link>
          <a href="#how" className="hover:text-foreground">How it works</a>
        </nav>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} GeoFix</p>
      </div>
    </footer>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <HowItWorks />
      <ForCustomers />
      <ForWorkers />
      <DownloadBand />
      <Footer />
    </div>
  )
}