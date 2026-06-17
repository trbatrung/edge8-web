import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { ExperienceSlider } from "@/components/experience/ExperienceSlider";

export const metadata: Metadata = {
  title: "The Vietnam Experience",
  description:
    "You came for an AI Retreat. You will leave with a new way to live. The people, the place, and the idea behind your week in Saigon.",
  alternates: { canonical: "/the-vietnam-experience" },
};

const CHAPTERS = [
  { title: "The Week", desc: "Three to five days, shaped hour by hour.", href: "/the-vietnam-experience/the-week" },
  { title: "The Arrival", desc: "VIP from the second you land.", href: "/the-vietnam-experience/arrival" },
  { title: "The Place", desc: "Saigon, and a neighborhood called Thao Dien.", href: "/the-vietnam-experience/place" },
  { title: "Travel Buddy", desc: "Your AI concierge, in your pocket.", href: "/the-vietnam-experience/travel-buddy" },
  { title: "Infinite Leverage", desc: "The AI idea you take home.", href: "/the-vietnam-experience/infinite-leverage" },
  { title: "The People", desc: "The team who make it yours.", href: "/the-vietnam-experience/people" },
];

export default function VietnamExperiencePage() {
  return (
    <div className="xp-page">
      <Nav />

      {/* Hero */}
      <section className="xp-hero">
        <div className="wrap">
          <p className="eyebrow">An AI retreat in Saigon</p>
          <h1 className="h-display">The Vietnam Experience</h1>
          <p className="xp-hero-lead">
            You came for an AI Retreat. You will leave with a new way to live.
          </p>
        </div>
      </section>

      {/* The slider */}
      <div className="xp-stage">
        <ExperienceSlider />
      </div>

      {/* Explore the chapters → sub-pages */}
      <section>
        <div className="wrap">
          <p className="eyebrow" style={{ marginBottom: 16 }}>The chapters</p>
          <h2 className="h-section">Explore the <em>experience</em></h2>
          <p className="lead" style={{ marginTop: 18, marginBottom: 48 }}>
            Step into any part of the week.
          </p>

          <div className="xp-chapters">
            {CHAPTERS.map((c) => (
              <Link key={c.href} href={c.href} className="xp-card">
                <div className="xp-card-top">
                  <h3>{c.title}</h3>
                  <span className="ar" aria-hidden>→</span>
                </div>
                <p>{c.desc}</p>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: 48 }}>
            <Link href="/saigon" className="btn btn-primary">
              Explore the retreat <span className="arrow" aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
