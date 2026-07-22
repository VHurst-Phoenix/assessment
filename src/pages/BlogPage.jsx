import { Link } from 'react-router-dom';
import './BlogPage.css';

const BlogPage = () => {
  return (
    <div className="animate-fade-slide" style={{ paddingBottom: '60px' }}>
      <div className="hero">
        <div className="hero-label">Coaching Insight Journal</div>
        <h1>Three Posts.<br />One Story.</h1>
        <p>Where Phoenix began, how the work evolved, and who it serves now. Read in sequence or enter wherever you are.</p>
      </div>

      <div className="series-intro">
        <div className="series-card">
          <h3 style={{ fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px' }}>About This Series</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '14px' }}>
            These three posts are a narrative arc — not three disconnected articles. They tell the honest story of how Phoenix Clear Insight Consulting came to be, what the work stands for, and who it is designed to serve.
          </p>
          <ul style={{ paddingLeft: '20px', color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.8 }}>
            <li><strong>Post 1:</strong> Federal Insider Perspective — Where it began</li>
            <li><strong>Post 2:</strong> Strategic Joy — The framework that found its audience</li>
            <li><strong>Post 3:</strong> Empowering Growth — The full evolution</li>
          </ul>
        </div>
      </div>

      {/* ── POST 1 ── */}
      <article className="post" id="post-1">
        <div className="post-header">
          <div className="post-series-tag">Coaching Insight Journal &nbsp;·&nbsp; Post 1 of 3</div>
          <h2>Federal Insider Perspective: Consulting for Working Parents and Teens</h2>
          <div className="subtitle">Where Phoenix began — and what it was always really about.</div>
        </div>
        <div className="post-body">
          <div className="post-meta">
            <span>May 20, 2025</span>
            <span className="dot"></span>
            <span>4 min read</span>
          </div>

          <p>I didn't start here.</p>
          <p>I started at home. At my kitchen table, or maybe the couch — I don't remember exactly, because what I do remember is the email.</p>
          <p>I had just come back from leave. Use-or-lose time that I had finally taken to be with my family — real time, present time, the kind you can't get back. And while I was still in that space, still exhaling, I learned that someone I loved had died. Grief had just walked in the door.</p>
          <p>Then the email arrived.</p>
          <p>It informed me, in careful bureaucratic language, that I was being placed on administrative leave. That my email access and system credentials would be withdrawn by 5 p.m. the following day. No conference room. No face-to-face conversation. No moment to collect myself or my things. Just words on a screen, a countdown, and a door closing — while I was still in the middle of grieving, in the middle of what should have been restoration.</p>
          <p>Twenty-five years. That's how long I had given to federal service. Twenty-five years of showing up, leading, building — not just programs, but people. I was good at it. I was recognized for it.</p>
          <p>And it ended in an email.</p>
          
          <div className="section-divider">— ◆ —</div>
          
          <h3>What I Knew That No One Else Did</h3>
          <p>Here's the thing about working inside the federal government for that long: you develop a kind of dual vision. You understand the system — the rhythms, the culture, the unspoken rules, the career ladder, the weight of acronyms and clearances and GS-levels. But you also see the people inside the system.</p>
          <p>And what I saw, over and over, was this:</p>

          <div className="pull-quote">
            <p>Capable people — brilliant, dedicated, experienced people — who had quietly lost themselves inside an institution. They were succeeding by every external measure and quietly unraveling inside.</p>
          </div>

          <p>I saw it in mid-level managers who couldn't name what they actually wanted anymore. I saw it in working parents trying to hold together a federal career and a teenager who needed them to be present in a completely different way. I saw it in professionals who had been so focused on the mission — the agency's mission — that they had no idea what their own mission was.</p>
          <p>I was one of them.</p>

          <div className="section-divider">— ◆ —</div>

          <h3>The Work I Was Called to Do</h3>
          <p>When I launched Phoenix Clear Insight Consulting, I started where I knew. I started with the people I understood most deeply: federal employees at mid-to-senior levels, working parents of teenagers and college students, and the unique intersection of those two worlds — parents who were also government professionals, trying to lead at work while their families needed something from them they hadn't yet figured out how to give.</p>
          <p>The work was never about government policy or compliance. It was always about the person inside the title. The parent behind the performance review. The professional who was so competent externally that no one thought to ask how they were doing internally.</p>
          <p>I brought three things to that work that are still at the core of everything I do:</p>
          <p><strong>Insider credibility.</strong> I had lived the federal experience. I didn't need a client to explain what it felt like to navigate a performance improvement plan, a reorganization, or a political transition. I had sat in those rooms.</p>
          <p><strong>A framework grounded in truth.</strong> Not positivity. Not platitudes. Truth. I built what I now call the See It → Believe It → Achieve It methodology because I needed it myself. Seeing clearly — not what you wish were true, but what is actually true — is the hardest and most necessary first step in any transformation.</p>
          <p><strong>Strategic Joy.</strong> This is the piece that surprised people the most. In a sector that measures success in outputs, deliverables, and performance ratings, I was asking people: Where is the joy? Not as a soft question. As a strategic one. Because joy is not a reward for success. It is a compass for it.</p>

          <div className="section-divider">— ◆ —</div>

          <h3>What Those Early Clients Taught Me</h3>
          <p>The federal professionals and working parents who came to Phoenix in those early days taught me something I hadn't fully anticipated: the presenting problem is never the real problem.</p>
          <p>A senior federal manager would come in saying she needed help with her leadership presence. What she actually needed was permission to want something different than what she had spent twenty years building.</p>
          <p>A working parent would come in saying his teenager was the problem. What he actually needed was to examine the model of success he was unconsciously passing down.</p>
          <p>Again and again, beneath the professional question was a personal one. Beneath the career challenge was an identity question. And that is where the real coaching began.</p>
          <p>Phoenix was never just a consulting firm. It was — and is — a transformation space. The clients who came to me in those early years showed me that the line between professional coaching and personal growth is not a line at all. It's a thread. And pulling it changes everything.</p>

          <div className="closing-line">
            <p>This is where Phoenix started. In the next post: how the work evolved — and why the framework I built for federal professionals turns out to be exactly what professional women in transition need, regardless of sector.</p>
          </div>
        </div>
      </article>

      {/* ── POST 2 ── */}
      <article className="post" id="post-2">
        <div className="post-header">
          <div className="post-series-tag">Coaching Insight Journal &nbsp;·&nbsp; Post 2 of 3</div>
          <h2>Strategic Joy Approach: Life Skills Training for Small Business Owners</h2>
          <div className="subtitle">Why finding your joy isn't soft — it's the most strategic thing you can do.</div>
        </div>
        <div className="post-body">
          <div className="post-meta">
            <span>May 20, 2025</span>
            <span className="dot"></span>
            <span>4 min read</span>
          </div>

          <p>Let me tell you what Strategic Joy is not.</p>
          <p>It is not a vision board. It is not positive thinking. It is not a motivational poster or a morning affirmation or a weekend retreat where you drink green juice and call it transformation.</p>
          <p>Strategic Joy is the deliberate, honest work of figuring out what actually matters to you — not what you've been told should matter, not what looks good on paper, not what keeps the people around you comfortable — but what is true. And then building a life and a career that moves toward that truth, on purpose.</p>
          <p>I developed this framework in the space between my federal career ending and Phoenix beginning. That in-between time — what I now call the intentional pause — is where I stopped performing productivity and started asking harder questions.</p>

          <div className="section-divider">— ◆ —</div>

          <h3>The Question That Changed Everything</h3>

          <div className="pull-quote">
            <p>Not: What are you good at? But: What makes you feel most alive when you're doing it? Those are not the same question.</p>
          </div>

          <p>For most high-achieving professionals, the gap between the answers is where all the suffering lives.</p>
          <p>I had spent twenty-five years being very, very good at things that had stopped lighting me up. I had optimized for competence and impact and recognition. And all of those things were real. But somewhere along the way, joy had become a casualty of achievement.</p>
          <p>When I started working with small business owners and early-stage entrepreneurs, I saw the same pattern in a different form. They had left corporate or government to build something of their own — and then promptly recreated the same joyless grind in a new container. They were their own bosses but slaves to a business model they hadn't designed for themselves.</p>
          <p>Strategic Joy cuts through that. It asks: Why are you building this? What is this for? Not in an abstract philosophical way — in a completely practical, decision-making way. Because your "why" is not just inspiration. It is navigation.</p>

          <div className="section-divider">— ◆ —</div>

          <h3>What the Framework Actually Does</h3>
          <p>Strategic Joy Training, as I deliver it through Phoenix, is a life skills framework designed for people in transition. It's for the entrepreneur who built a business but lost herself in the process. It's for the professional who is technically free but emotionally still trapped in the old identity. It's for anyone who has reached a milestone and found, confusingly, that it doesn't feel like they thought it would.</p>
          <p>The framework works in three movements — and if you've encountered my See It → Believe It → Achieve It methodology, you'll recognize the arc:</p>
          <p><strong>See It:</strong> You have to be honest about where you are before you can decide where to go. Not where you wish you were. Not where you told people you'd be by now. Where you actually are. That honesty is the beginning of everything.</p>
          <p><strong>Believe It:</strong> Joy requires permission. Most high-achieving people have been so conditioned to earn their rest, earn their satisfaction, earn their happiness, that they don't know how to simply claim it. This phase is about building the internal permission structure that allows you to want what you actually want.</p>
          <p><strong>Achieve It:</strong> This is where joy becomes strategy. Where the insight becomes a plan. Where you stop waiting for the right conditions and start designing for them. Not perfectly. Not all at once. But intentionally, with one aligned move at a time.</p>

          <div className="section-divider">— ◆ —</div>

          <h3>Why This Matters for Business Owners Specifically</h3>
          <p>Small business ownership is one of the loneliest professional experiences I know. You are simultaneously the CEO, the client manager, the marketer, the accountant, and the janitor. The stakes are personal in a way that corporate work rarely is.</p>
          <p>What I observed in the entrepreneurs I worked with — and what I experienced myself in building Phoenix — is that without a clear sense of your own joy and your own why, the business becomes a place to hide. A very busy, very convincing place to avoid the harder questions.</p>
          <p>Strategic Joy Training interrupts that pattern. It brings your personal truth back into your professional strategy. It asks you to measure success not just in revenue and retention, but in alignment — are you building something that feels like you? Is the work connected to what you actually care about?</p>
          <p>For some clients, this work confirms they are exactly where they need to be. For others, it catalyzes a significant pivot. For all of them, it produces clarity — and clarity, in my experience, is always the most valuable business asset.</p>

          <div className="closing-line">
            <p>In the final post of this series: who Phoenix is for now, and what the full evolution of this work looks like — including why the framework built in government conference rooms and small business consultations turned out to be exactly what professional women in transition need most.</p>
          </div>
        </div>
      </article>

      {/* ── POST 3 ── */}
      <article className="post" id="post-3">
        <div className="post-header">
          <div className="post-series-tag">Coaching Insight Journal &nbsp;·&nbsp; Post 3 of 3</div>
          <h2>Empowering Growth: Coaching for Professional and Personal Transformation</h2>
          <div className="subtitle">The full picture — who I serve, how I serve them, and why this work keeps evolving.</div>
        </div>
        <div className="post-body">
          <div className="post-meta">
            <span>May 20, 2025</span>
            <span className="dot"></span>
            <span>5 min read</span>
          </div>

          <p>There is a version of this post I could write that lists my credentials, describes my methodology, and summarizes my service offerings in clean, professional language.</p>
          <p>That is not this post.</p>
          <p>This post is the honest one. The one about how this work grew — and what I learned when it outgrew the container I originally built for it.</p>

          <div className="section-divider">— ◆ —</div>

          <h3>Where I Started vs. Where I Am</h3>
          <p>I began my coaching practice with a narrow and specific focus: federal employees, working parents navigating teenagers and college transitions, and the intersection of those two worlds. That focus was intentional. It was where my lived experience was deepest and my credibility was clearest.</p>
          <p>And it worked. I understood those clients from the inside out. I knew what a mid-level federal manager meant when she said she felt invisible. I didn't need translations. I had been there.</p>

          <div className="pull-quote">
            <p>But transformation is not sector-specific. The pattern I kept seeing — capable people who had outgrown their current identity but didn't know how to step into the next one — was everywhere.</p>
          </div>

          <p>It was in the corporate executive who had spent fifteen years climbing a ladder and arrived at the top to find she had no idea what she actually wanted. It was in the entrepreneur who had built a six-figure business that felt like a trap. It was in the woman who had done everything right — by every external standard — and was quietly, privately, unraveling.</p>
          <p>These women were not federal employees. They were not all working parents. But they needed exactly what Phoenix was built to provide.</p>
          <p>So the work evolved. Not because I abandoned my roots, but because I followed what was true.</p>

          <div className="section-divider">— ◆ —</div>

          <h3>Who Phoenix Is For Now</h3>
          <p>Phoenix Clear Insight Consulting serves professional women in transition. That is the center.</p>
          <p>The transition might look like a career pivot — leaving corporate, launching something of your own, returning after a pause. It might look like a promotion that should feel like a win but somehow doesn't. It might look like a reorganization, a restructuring, a position elimination. It might look like a decade of building someone else's dream and finally, at great personal cost, deciding to build your own.</p>
          <p>The federal professionals are still here. The working parents are still here. The small business owners navigating identity and joy alongside revenue — still here. But they sit within a much larger, more honest picture of who this work is actually for.</p>
          <p>The common thread is not a job title or a sector. It is a season. A season of knowing that something needs to shift, but not yet knowing what — or how — or whether you are allowed to want what you want.</p>
          <p>That season is exactly what Phoenix was built for.</p>

          <div className="section-divider">— ◆ —</div>

          <h3>The Framework That Holds It All</h3>
          <p>Everything I do is organized around three movements. I call them See It, Believe It, and Achieve It — and I want to explain what those actually mean, because they are not what they sound like.</p>
          <p><strong>See It</strong> is not about vision boards or goal-setting. It is about radical honesty with your current reality. What is actually true right now — not what you wish were true, not what you've told your family, not the story you've been performing for the past decade. This is the hardest phase for high-achievers because it requires them to stop moving long enough to look.</p>
          <p><strong>Believe It</strong> is not about confidence or mindset hacks. It is about identity. Specifically, about the identity you've been operating from — and whether it still fits who you are becoming. Most of the people I work with are running on an old operating system. Believe It is the work of updating that system. Gently, honestly, completely.</p>
          <p><strong>Achieve It</strong> is not about hustle or productivity. It is about alignment. Taking action that flows from your actual values, your actual strengths, your actual vision — not from fear, obligation, or other people's definitions of success. When action comes from that place, it is sustainable. When it doesn't, it is expensive.</p>
          <p>Woven through all three phases is the BRAVO framework — the daily practice I developed to keep clients moving between sessions. BRAVO stands for Brave, Rise, Act, Validate, Own. It is a five-step daily check-in that keeps the transformation from being something that happens in coaching sessions and nothing else.</p>
          <p>And beneath all of it, as the navigational north star, is Strategic Joy — the practice of regularly asking: Is what I'm building connected to what actually matters to me? Not as a luxury question. As a survival question.</p>

          <div className="section-divider">— ◆ —</div>

          <h3>What I Know Now That I Didn't Know Then</h3>
          <p>I know now that the position elimination that felt like an ending was the most important beginning of my life.</p>
          <p>I know now that the intentional pause I took before launching Phoenix — the one that felt irresponsible and uncertain and frankly terrifying — was the most responsible thing I could have done. It was in that pause that I stopped performing and started discovering.</p>
          <p>I know now that the federal professionals and the working parents and the small business owners and the women in mid-career transition are all asking the same question, just in different languages: <em>Who am I becoming? And is it okay to want what I want?</em></p>
          <p>The answer, in every case, is yes.</p>
          <p>That is what Phoenix is for. Not to give you someone else's blueprint. To help you see your own clearly enough to trust it — and then to build from there.</p>

          <div className="post-cta">
            <h3>Ready to Start With Clarity?</h3>
            <p>If something in these three posts resonated — if you recognized yourself somewhere in these pages — the next step is simple.</p>
            <Link to="/assessment" className="btn btn-gold">Take the Free Clarity Assessment →</Link>
            <span className="secondary" style={{ display: 'block', marginTop: '14px', color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', fontStyle: 'italic' }}>
              15 minutes. Free. Shows you exactly where you are.<br />Or <a href="https://www.phoenixclearinsight.com/discovery" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>schedule a free 15-minute call</a> if you'd rather talk first.
            </span>
          </div>
        </div>
      </article>

    </div>
  );
};

export default BlogPage;
