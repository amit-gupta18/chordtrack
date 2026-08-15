import { Link } from 'react-router-dom'
import { GuitarIcon } from '../components/home/GuitarIcon'
import { MusicNoteIcon } from '../components/home/MusicNoteIcon'

const features = [
  {
    title: 'Live chord detection',
    description: 'Play into your mic — Chordtrack reads your chords in real time with chroma-based matching.',
    icon: '🎸',
  },
  {
    title: '1-minute sessions',
    description: 'Focused timed drills count every switch and chord hold so you can measure real progress.',
    icon: '⏱️',
  },
  {
    title: 'AI coach',
    description: 'After each minute, get personalized feedback on your progression, clarity, and next drill.',
    icon: '✨',
  },
  {
    title: 'Progress journal',
    description: 'Sessions auto-log to your journal with chord history, streaks, and analytics over time.',
    icon: '📈',
  },
]

const steps = [
  { step: '01', title: 'Start the timer', text: 'Hit start and get a full 60-second practice window.' },
  { step: '02', title: 'Play & switch', text: 'Strum chords naturally — we track plays and every switch.' },
  { step: '03', title: 'Review & improve', text: 'Read your AI summary and watch your records grow.' },
]

const chords = ['A', 'Am', 'D', 'G', 'Em', 'C', 'E', 'F']

export function HomePage() {
  return (
    <div className="home-page">
      <header className="home-nav">
        <Link to="/" className="home-logo">
          <MusicNoteIcon className="h-5 w-5 text-atlas-blue" filled />
          <span>Chordtrack</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login" className="home-nav-link">
            Sign in
          </Link>
          <Link to="/register" className="atlas-btn-primary px-4 py-2 text-sm">
            Get started
          </Link>
        </div>
      </header>

      {/* Section 1 — Hero */}
      <section className="home-hero">
        <div className="home-hero-bg" aria-hidden />
        <MusicNoteIcon className="home-note home-note-1" filled />
        <MusicNoteIcon className="home-note home-note-2" />
        <MusicNoteIcon className="home-note home-note-3" filled />
        <MusicNoteIcon className="home-note home-note-4" />
        <MusicNoteIcon className="home-note home-note-5" filled />

        <div className="home-hero-inner">
          <div className="home-hero-copy home-fade-up">
            <p className="home-eyebrow">Your guitar practice companion</p>
            <h1 className="home-title">
              Chord<span className="home-title-accent">track</span>
            </h1>
            <p className="home-tagline">
              Detect chords live, run 1-minute switch drills, and let AI coach your progression — all in one
              place.
            </p>
            <div className="home-hero-actions">
              <Link to="/register" className="home-cta-primary">
                Start practicing free
              </Link>
              <Link to="/login" className="home-cta-secondary">
                I have an account
              </Link>
            </div>
          </div>

          <div className="home-hero-visual home-fade-up home-fade-up-delay">
            <div className="home-guitar-ring home-guitar-ring-1" />
            <div className="home-guitar-ring home-guitar-ring-2" />
            <div className="home-guitar-stage">
              <GuitarIcon className="home-guitar text-atlas-blue" />
            </div>
            <div className="home-chord-pills" aria-hidden>
              {chords.map((chord, i) => (
                <span key={chord} className="home-chord-pill" style={{ animationDelay: `${i * 0.35}s` }}>
                  {chord}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 — Features */}
      <section className="home-section">
        <div className="home-section-header home-fade-up">
          <p className="home-eyebrow">Four pillars</p>
          <h2 className="home-section-title">Everything you need to track your chords</h2>
          <p className="home-section-sub">
            Chordtrack is built around short, measurable sessions — not endless guessing about whether you
            improved.
          </p>
        </div>
        <div className="home-feature-grid">
          {features.map((feature, i) => (
            <article
              key={feature.title}
              className="home-feature-card home-fade-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="home-feature-icon" aria-hidden>
                {feature.icon}
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Section 3 — How it works */}
      <section className="home-section home-section-alt">
        <div className="home-section-header home-fade-up">
          <p className="home-eyebrow">How it works</p>
          <h2 className="home-section-title">One minute. Real data. Better playing.</h2>
        </div>
        <div className="home-steps">
          {steps.map((item, i) => (
            <div
              key={item.step}
              className="home-step home-fade-up"
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <span className="home-step-num">{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4 — Progress / progression */}
      <section className="home-section">
        <div className="home-progress-layout">
          <div className="home-fade-up">
            <p className="home-eyebrow">Your progression</p>
            <h2 className="home-section-title">See every chord you formed</h2>
            <p className="home-section-sub">
              Each session records your full chord sequence, switch count, and unique shapes — so you can spot
              patterns, weak transitions, and steady improvement week over week.
            </p>
            <ul className="home-progress-list">
              <li>
                <MusicNoteIcon className="h-4 w-4 shrink-0 text-atlas-blue" filled />
                Timestamped chord progression
              </li>
              <li>
                <MusicNoteIcon className="h-4 w-4 shrink-0 text-atlas-blue" filled />
                Switch rate per minute
              </li>
              <li>
                <MusicNoteIcon className="h-4 w-4 shrink-0 text-atlas-blue" filled />
                Session history & AI insights
              </li>
            </ul>
          </div>

          <div className="home-progress-demo home-fade-up home-fade-up-delay">
            <div className="home-demo-card">
              <p className="home-demo-label">Live session</p>
              <p className="home-demo-timer">0:42</p>
              <p className="home-demo-chord">G</p>
              <div className="home-demo-stats">
                <div>
                  <span>8</span>
                  <small>plays</small>
                </div>
                <div>
                  <span>6</span>
                  <small>switches</small>
                </div>
              </div>
              <div className="home-demo-sequence">
                {['A', 'D', 'G', 'Em', 'C', 'G'].map((c, i) => (
                  <span key={`${c}-${i}`}>{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 — CTA */}
      <section className="home-cta-section">
        <div className="home-cta-inner home-fade-up">
          <MusicNoteIcon className="home-cta-note home-cta-note-left" filled />
          <GuitarIcon className="home-cta-guitar text-white/20" />
          <MusicNoteIcon className="home-cta-note home-cta-note-right" />

          <h2>Ready to track your chords?</h2>
          <p>Join free, plug in your guitar, and run your first 1-minute session in under a minute.</p>
          <Link to="/register" className="home-cta-light">
            Create your account
          </Link>
        </div>
      </section>

      <footer className="home-footer">
        <Link to="/" className="home-logo">
          <MusicNoteIcon className="h-4 w-4 text-atlas-blue" filled />
          <span>Chordtrack</span>
        </Link>
        <p>© {new Date().getFullYear()} Chordtrack — practice smarter.</p>
      </footer>
    </div>
  )
}
