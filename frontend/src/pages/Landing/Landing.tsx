import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [_aiMessage, setAiMessage] = useState<string>("Exam session initialized. Monitoring 847 active candidates across 12 campuses. Zero anomalies detected in the last 4 minutes.");

  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(entries => {
      entries.forEach((entry: IntersectionObserverEntry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;
    let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    let tx = cx, ty = cy;
    let animationFrameId: number;
    const handleMouseMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY; };
    window.addEventListener('mousemove', handleMouseMove);
    const animate = () => {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      glow.style.left = cx + 'px'; glow.style.top = cy + 'px';
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => { window.removeEventListener('mousemove', handleMouseMove); cancelAnimationFrame(animationFrameId); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let W = window.innerWidth, H = window.innerHeight;
    let nodes: any[] = [];
    const mouse = { x: 0, y: 0 };
    let animationFrameId: number;

    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    const initNodes = () => {
      nodes = [];
      for (let i = 0; i < 60; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.8 + 0.6, pulse: Math.random() * Math.PI * 2
        });
      }
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const g1 = ctx.createRadialGradient(W * 0.2, H * 0.1, 0, W * 0.2, H * 0.1, W * 0.45);
      g1.addColorStop(0, 'rgba(79,70,229,.055)'); g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
      const g2 = ctx.createRadialGradient(W * 0.8, H * 0.85, 0, W * 0.8, H * 0.85, W * 0.4);
      g2.addColorStop(0, 'rgba(124,58,237,.04)'); g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
      const gm = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 180);
      gm.addColorStop(0, 'rgba(79,70,229,.07)'); gm.addColorStop(1, 'transparent');
      ctx.fillStyle = gm; ctx.fillRect(0, 0, W, H);
      
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y, dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const alpha = (0.6 - dist / 160) * 0.22;
            const mdxa = mouse.x - a.x, mdya = mouse.y - a.y, mdista = Math.sqrt(mdxa * mdxa + mdya * mdya);
            const boost = mdista < 180 ? (1 - (mdista / 180)) * 0.5 : 0;
            ctx.beginPath(); ctx.strokeStyle = `rgba(120,110,255,${alpha + boost})`; ctx.lineWidth = 0.6;
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      const now = Date.now() * 0.0008;
      nodes.forEach(n => {
        const pulse = Math.sin(now + n.pulse) * 0.5 + 0.5;
        const mdx = mouse.x - n.x, mdy = mouse.y - n.y, md = Math.sqrt(mdx * mdx + mdy * mdy);
        const mBoost = md < 180 ? (1 - (md / 180)) * 0.8 : 0;
        const r = n.r * (1 + pulse * 0.4 + mBoost * 0.6);
        const alpha = 0.3 + pulse * 0.3 + mBoost * 0.3;
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fillStyle = `rgba(148,140,255,${alpha})`; ctx.fill();
        if (mBoost > 0.3) { ctx.beginPath(); ctx.arc(n.x, n.y, r * 2.5, 0, Math.PI * 2); ctx.fillStyle = `rgba(79,70,229,${mBoost * 0.08})`; ctx.fill(); }
      });
    };
    const update = () => {
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1;
        const dx = mouse.x - n.x, dy = mouse.y - n.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 180 && d > 1) {
          n.vx += dx / d * 0.003; n.vy += dy / d * 0.003;
          const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
          if (speed > 0.6) { n.vx *= 0.6 / speed; n.vy *= 0.6 / speed; }
        }
      });
    };
    const loop = () => { draw(); update(); animationFrameId = requestAnimationFrame(loop); };
    const handleMouseMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener('resize', () => { resize(); initNodes(); });
    window.addEventListener('mousemove', handleMouseMove);
    resize(); initNodes(); loop();
    return () => { window.removeEventListener('resize', resize); window.removeEventListener('mousemove', handleMouseMove); cancelAnimationFrame(animationFrameId); };
  }, []);

  useEffect(() => {
    const msgs = [
      "Behavioral baseline established for 847 candidates. Session integrity nominal.",
      "Roll 2214 flagged: gaze deviation 4.1σ — confidence 97%. Live feed queued.",
      "Question variant distribution complete. Zero duplicate allocations detected.",
      "Subjective answer batch graded: 234 answers, avg confidence 91.3%. 18 queued for review.",
      "Network latency spike detected at Node 7 (Mumbai). Automatic failover initiated. Zero disruption."
    ];
    let i = 0;
    const interval = setInterval(() => { i++; setAiMessage(msgs[i % msgs.length]); }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
    script.async = true;
    script.onload = () => {
      // @ts-expect-error Ignoring window.Chart type
      if (window.Chart) {
        const canvas = document.getElementById('analyticsChart') as HTMLCanvasElement;
        if (canvas && !canvas.getAttribute('data-chart-initialized')) {
          canvas.setAttribute('data-chart-initialized', 'true');
          const ctx = canvas.getContext('2d');
          if (ctx) {
             // @ts-expect-error Ignoring global Chart type because we inject script
            new window.Chart(ctx, {
              type: 'line',
              data: {
                labels: ['Oct','Nov','Dec','Jan','Feb','Mar','Apr'],
                datasets: [{
                  label: 'Pass', data: [78,81,79,83,82,86,84],
                  borderColor: 'rgba(79,70,229,.9)', backgroundColor: 'rgba(79,70,229,.08)',
                  borderWidth: 2, pointBackgroundColor: 'rgba(79,70,229,1)',
                  pointRadius: 3, pointHoverRadius: 5, fill: true, tension: 0.4
                }, {
                  label: 'Fail', data: [22,19,21,17,18,14,16],
                  borderColor: 'rgba(239,68,68,.7)', backgroundColor: 'rgba(239,68,68,.05)',
                  borderWidth: 2, pointBackgroundColor: 'rgba(239,68,68,1)',
                  pointRadius: 3, pointHoverRadius: 5, fill: true, tension: 0.4
                }]
              },
              options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(12,12,20,.95)', borderColor: 'rgba(255,255,255,.12)', borderWidth: 1, titleColor: 'rgba(255,255,255,.9)', bodyColor: 'rgba(255,255,255,.6)', padding: 12, cornerRadius: 10 } },
                scales: { x: { grid: { color: 'rgba(255,255,255,.04)', drawBorder: false }, ticks: { color: 'rgba(255,255,255,.35)', font: { size: 11, family: 'Inter' } } }, y: { grid: { color: 'rgba(255,255,255,.04)', drawBorder: false }, ticks: { color: 'rgba(255,255,255,.35)', font: { size: 11, family: 'Inter' }, callback: (v: number | string) => v + '%' }, min: 0, max: 100 } }
              }
            });
          }
        }
      }
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const toggleFaq = (e: React.MouseEvent<HTMLDivElement>) => {
    const item = (e.target as HTMLElement).closest('.faq-item');
    if (item) {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    }
  };

  const changeProductTab = (e: React.MouseEvent<HTMLButtonElement>) => {
    document.querySelectorAll('.product-tab').forEach(t => t.classList.remove('active'));
    (e.target as HTMLElement).closest('.product-tab')?.classList.add('active');
  };

  return (
    <div className="landing-wrapper" onClick={(e) => {
      const el = e.target as HTMLElement;
      if (el.closest('.faq-q')) {
        toggleFaq(e as unknown as React.MouseEvent<HTMLDivElement>);
      }
      if (el.closest('.product-tab')) {
        changeProductTab(e as unknown as React.MouseEvent<HTMLButtonElement>);
      }
    }}>

{/*  Neural canvas background  */}
<canvas id="neural-canvas" ref={canvasRef}></canvas>

{/*  Film grain  */}
<div className="grain" aria-hidden="true"></div>

{/*  Cursor glow  */}
<div className="cursor-glow" id="cursorGlow" ref={glowRef} aria-hidden="true"></div>

{/*  ─────────────────────────── NAV ───────────────────────────  */}
<nav role="navigation" aria-label="Main navigation">
  <a className="nav-logo" href="#">
    <div className="nav-logo-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    </div>
    <span className="nav-name">SecureExam Enterprise</span>
  </a>
  <div className="nav-links">
    <a href="#product">Product</a>
    <a href="#security">Security</a>
    <a href="#analytics">Analytics</a>
    <a href="#pricing">Pricing</a>
  </div>
  <div className="nav-right">
    <Link className="nav-btn nav-btn-ghost" to="/login">Sign in</Link>
    <Link className="nav-btn nav-btn-solid" to="/register">Get started</Link>
  </div>
</nav>

{/*  ─────────────────────────── HERO ───────────────────────────  */}
<section className="hero" aria-labelledby="hero-heading">
  <div className="hero-content">
    <div className="hero-badge">
      <span className="hero-badge-dot"></span>
      Now in enterprise general availability
    </div>

    <h1 id="hero-heading">
      <div className="hero-headline">The future of</div>
      <div className="hero-sub-label">AI-powered · Zero-compromise · Enterprise-grade</div>
      <div className="hero-headline"><em>examination</em></div>
      <div className="hero-headline">infrastructure.</div>
    </h1>

    <p className="hero-desc">
      SecureExam Enterprise brings military-grade security, real-time AI proctoring, and adaptive intelligence to every exam your institution runs — at any scale.
    </p>

    <div className="hero-cta">
      <Link className="btn-primary" to="/register">
        Deploy for your institution
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </Link>
      <a className="btn-secondary" href="#product">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px', height: '15px' }}><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
        Watch demo
      </a>
    </div>

    <div className="hero-trust">
      <div className="trust-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        SOC 2 Type II
      </div>
      <div className="trust-divider"></div>
      <div className="trust-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        ISO 27001
      </div>
      <div className="trust-divider"></div>
      <div className="trust-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
        GDPR Compliant
      </div>
      <div className="trust-divider"></div>
      <div className="trust-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
        99.99% Uptime SLA
      </div>
    </div>
  </div>
</section>

{/*  ─────────────────────────── METRICS ───────────────────────────  */}
<div className="metrics-strip reveal">
  <div className="section-inner">
    <div className="metrics-grid">
      <div className="metric-item">
        <div className="metric-val">2.4M+</div>
        <div className="metric-label">Exams Conducted</div>
      </div>
      <div className="metric-item">
        <div className="metric-val">340+</div>
        <div className="metric-label">Institutions Worldwide</div>
      </div>
      <div className="metric-item">
        <div className="metric-val">99.97%</div>
        <div className="metric-label">Integrity Rate</div>
      </div>
      <div className="metric-item">
        <div className="metric-val">&lt;80ms</div>
        <div className="metric-label">Global Response Time</div>
      </div>
    </div>
  </div>
</div>

{/*  ─────────────────────────── PROBLEM ───────────────────────────  */}
<section className="problem-section" id="problem" aria-labelledby="problem-heading">
  <div className="section-inner">
    <div className="reveal">
      <div className="section-label">The problem</div>
      <h2 id="problem-heading" className="section-heading">Examination systems<br/>built for another era.</h2>
    </div>
    <div className="problem-grid">
      <div className="reveal reveal-delay-1">
        <p className="section-body">Universities, governments, and certification bodies run mission-critical assessments on infrastructure that was never designed for the AI era — brittle, insecure, and impossible to scale.</p>
        <p className="section-body" style={{ marginTop: '20px' }}>The result: billion-dollar losses to academic fraud, catastrophic data breaches, and experiences that erode institutional trust.</p>
      </div>
      <div className="problem-cards reveal reveal-delay-2">
        <div className="problem-card">
          <div className="problem-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <div className="problem-card-title">Undetectable cheating at scale</div>
            <div className="problem-card-body">Legacy systems miss 73% of sophisticated collusion attempts, AI-generated answers, and identity spoofing.</div>
          </div>
        </div>
        <div className="problem-card">
          <div className="problem-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          </div>
          <div>
            <div className="problem-card-title">Infrastructure that collapses under load</div>
            <div className="problem-card-body">Concurrent exam sessions routinely exceed what traditional systems were architected to handle.</div>
          </div>
        </div>
        <div className="problem-card">
          <div className="problem-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </div>
          <div>
            <div className="problem-card-title">No intelligence. No adaptivity.</div>
            <div className="problem-card-body">Static question banks and rigid grading fail to capture real competency or adapt to individual learning.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

{/*  ─────────────────────────── AI INTELLIGENCE ───────────────────────────  */}
<section className="ai-section" id="ai" aria-labelledby="ai-heading">
  <div className="section-inner">
    <div className="reveal" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <div className="section-label">AI Intelligence</div>
      <h2 id="ai-heading" className="section-heading">Your examination<br/>thinks for itself.</h2>
      <p className="section-body" style={{ margin: '0 auto' }}>An AI engine purpose-built for assessment integrity — detecting anomalies, generating adaptive questions, and grading subjective answers with human-level precision.</p>
    </div>
    <div className="ai-grid">
      <div className="ai-features reveal reveal-delay-1">
        <div className="ai-feat active">
          <div className="ai-feat-num">01</div>
          <div>
            <div className="ai-feat-title">Behavioral Anomaly Detection</div>
            <div className="ai-feat-body">Real-time gaze tracking, keystroke dynamics, and browser fingerprinting identify suspicious patterns before a violation occurs.</div>
          </div>
        </div>
        <div className="ai-feat">
          <div className="ai-feat-num">02</div>
          <div>
            <div className="ai-feat-title">Adaptive Question Generation</div>
            <div className="ai-feat-body">AI generates unique exam variants per student from your question bank, making sharing answers structurally impossible.</div>
          </div>
        </div>
        <div className="ai-feat">
          <div className="ai-feat-num">03</div>
          <div>
            <div className="ai-feat-title">Subjective Answer Grading</div>
            <div className="ai-feat-body">Large language models evaluate long-form answers against expert rubrics, with confidence scores and explainability.</div>
          </div>
        </div>
        <div className="ai-feat">
          <div className="ai-feat-num">04</div>
          <div>
            <div className="ai-feat-title">Code Execution & Assessment</div>
            <div className="ai-feat-body">Sandboxed multi-language compiler with AI-powered test case generation and time/space complexity analysis.</div>
          </div>
        </div>
      </div>
      <div className="ai-visual reveal reveal-delay-2">
        <div className="ai-screen">
          <div className="ai-screen-top">
            <div className="ai-screen-dot" style={{ background: '#EF4444' }}></div>
            <div className="ai-screen-dot" style={{ background: '#F59E0B' }}></div>
            <div className="ai-screen-dot" style={{ background: '#22C55E' }}></div>
          </div>
          <div className="ai-screen-body">
            <div className="ai-msg ai-msg-system">
              <div className="ai-msg-label">SecureExam AI</div>
              Exam session initialized. Monitoring 847 active candidates across 12 campuses. Zero anomalies detected in the last 4 minutes.
            </div>
            <div className="ai-msg ai-msg-user">
              <div className="ai-msg-label" style={{ textAlign: 'right' }}>Examiner</div>
              Flag any candidate exhibiting gaze deviation greater than 3 standard deviations.
            </div>
            <div className="ai-msg ai-msg-system">
              <div className="ai-msg-label">SecureExam AI</div>
              Flagged 2 candidates: Roll 2214 (deviation: 4.1σ, confidence 97%) and Roll 3087 (deviation: 3.4σ, confidence 89%). Live feeds queued for review. Intervention recommended within 90 seconds.
            </div>
            <div className="ai-typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

{/*  ─────────────────────────── SECURITY ───────────────────────────  */}
<section className="security-section" id="security" aria-labelledby="security-heading">
  <div className="section-inner">
    <div className="reveal" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <div className="section-label">Security Architecture</div>
      <h2 id="security-heading" className="section-heading">Built like the<br/>systems that protect nations.</h2>
    </div>
    <div className="security-grid">
      <div className="sec-card reveal reveal-delay-1">
        <div className="sec-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '22px', height: '22px' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div className="sec-card-title">Safe Exam Browser Integration</div>
        <div className="sec-card-body">Deep integration with Safe Exam Browser locks down the OS environment, preventing screen capture, alt-tab, clipboard access, and process injection.</div>
        <div className="sec-badge"><span className="sec-badge-dot"></span>Hardware-level enforcement</div>
      </div>
      <div className="sec-card reveal reveal-delay-2">
        <div className="sec-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '22px', height: '22px' }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        </div>
        <div className="sec-card-title">End-to-End Encryption</div>
        <div className="sec-card-body">AES-256 encryption for all exam content at rest. TLS 1.3 in transit. Question banks are decrypted client-side only at the moment of rendering.</div>
        <div className="sec-badge"><span className="sec-badge-dot"></span>Zero-knowledge architecture</div>
      </div>
      <div className="sec-card reveal reveal-delay-3">
        <div className="sec-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '22px', height: '22px' }}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
        </div>
        <div className="sec-card-title">Multi-Factor Identity Verification</div>
        <div className="sec-card-body">Biometric face matching, government ID validation, and continuous re-authentication throughout the exam session.</div>
        <div className="sec-badge"><span className="sec-badge-dot"></span>99.3% identity accuracy</div>
      </div>
      <div className="sec-card reveal reveal-delay-1">
        <div className="sec-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '22px', height: '22px' }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </div>
        <div className="sec-card-title">Real-Time Anomaly Monitoring</div>
        <div className="sec-card-body">Stream processing engine analyzes behavioral signals at sub-100ms latency. Proctors receive instant alerts ranked by violation confidence.</div>
        <div className="sec-badge"><span className="sec-badge-dot"></span>&lt;100ms detection latency</div>
      </div>
      <div className="sec-card reveal reveal-delay-2">
        <div className="sec-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '22px', height: '22px' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <div className="sec-card-title">Immutable Audit Trail</div>
        <div className="sec-card-body">Every action is cryptographically signed and written to an append-only audit log. Legally admissible evidence for academic misconduct proceedings.</div>
        <div className="sec-badge"><span className="sec-badge-dot"></span>Blockchain-anchored logs</div>
      </div>
      <div className="sec-card reveal reveal-delay-3">
        <div className="sec-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '22px', height: '22px' }}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
        </div>
        <div className="sec-card-title">Global Edge Delivery</div>
        <div className="sec-card-body">212 PoPs across 6 continents. Exam delivery latency under 80ms globally. Automatic failover with zero data loss during infrastructure events.</div>
        <div className="sec-badge"><span className="sec-badge-dot"></span>212 global edge nodes</div>
      </div>
    </div>
  </div>
</section>

{/*  ─────────────────────────── PRODUCT SHOWCASE ───────────────────────────  */}
<section className="product-section" id="product" aria-labelledby="product-heading">
  <div className="section-inner">
    <div className="reveal" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <div className="section-label">Product</div>
      <h2 id="product-heading" className="section-heading">Not a dashboard.<br/>An operating system.</h2>
      <p className="section-body" style={{ margin: '0 auto' }}>Every surface designed around how educators and institutions actually think — fast, command-driven, and built for depth.</p>
    </div>
    <div className="reveal reveal-delay-1">
      <div className="product-tabs" role="tablist">
        <button className="product-tab active" role="tab">Teacher Portal</button>
        <button className="product-tab" role="tab">Exam Builder</button>
        <button className="product-tab" role="tab">Analytics</button>
        <button className="product-tab" role="tab">Student View</button>
      </div>
    </div>
    <div className="product-display reveal reveal-delay-2">
      <div className="product-topbar">
        <div className="topbar-dots">
          <div className="topbar-dot" style={{ background: '#EF4444' }}></div>
          <div className="topbar-dot" style={{ background: '#F59E0B' }}></div>
          <div className="topbar-dot" style={{ background: '#22C55E' }}></div>
        </div>
        <div className="topbar-title">SecureExam Enterprise — Teacher Portal</div>
        <div className="topbar-actions">
          <div className="topbar-action">Live session: 847 candidates</div>
          <div className="topbar-action" style={{ color: 'var(--success)', borderColor: 'rgba(34,197,94,.2)' }}>● System nominal</div>
        </div>
      </div>
      <div className="product-body">
        <div className="product-sidebar">
          <div className="sidebar-section">Command Center</div>
          <div className="sidebar-item active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Dashboard
          </div>
          <div className="sidebar-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Exams
            <span className="sidebar-badge">12</span>
          </div>
          <div className="sidebar-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Question Bank
          </div>
          <div className="sidebar-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Live Monitoring
          </div>
          <div className="sidebar-section">Reports</div>
          <div className="sidebar-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Analytics
          </div>
          <div className="sidebar-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            Results
          </div>
        </div>
        <div className="product-main">
          <div className="product-main-header">
            <div className="main-title">Active Examinations</div>
            <div className="main-cta">
              <button className="cta-btn cta-btn-ghost">Import questions</button>
              <button className="cta-btn cta-btn-primary">+ Create exam</button>
            </div>
          </div>
          <div className="exam-cards">
            <div className="exam-card">
              <div className="exam-card-header">
                <div className="exam-card-title">Data Structures — Final</div>
                <span className="exam-status status-live">Live</span>
              </div>
              <div className="exam-meta">
                <span className="exam-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  342 candidates
                </span>
                <span className="exam-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  47 min left
                </span>
              </div>
              <div className="exam-progress"><div className="exam-progress-fill" style={{ width: '62%' }}></div></div>
            </div>
            <div className="exam-card">
              <div className="exam-card-header">
                <div className="exam-card-title">Algorithms — Midterm</div>
                <span className="exam-status status-live">Live</span>
              </div>
              <div className="exam-meta">
                <span className="exam-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  189 candidates
                </span>
                <span className="exam-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  1h 12m left
                </span>
              </div>
              <div className="exam-progress"><div className="exam-progress-fill" style={{ width: '38%' }}></div></div>
            </div>
            <div className="exam-card">
              <div className="exam-card-header">
                <div className="exam-card-title">OS Design — Quiz 4</div>
                <span className="exam-status status-review">Grading</span>
              </div>
              <div className="exam-meta">
                <span className="exam-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  98 candidates
                </span>
                <span className="exam-meta-item">AI grading 73%</span>
              </div>
              <div className="exam-progress"><div className="exam-progress-fill" style={{ width: '73%', background: 'linear-gradient(90deg,var(--warn),#FBBF24)' }}></div></div>
            </div>
            <div className="exam-card">
              <div className="exam-card-header">
                <div className="exam-card-title">Networks — Final Exam</div>
                <span className="exam-status status-draft">Scheduled</span>
              </div>
              <div className="exam-meta">
                <span className="exam-meta-item">Starts in 3 days</span>
                <span className="exam-meta-item">218 enrolled</span>
              </div>
              <div className="exam-progress"><div className="exam-progress-fill" style={{ width: '0%' }}></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

{/*  ─────────────────────────── ANALYTICS ───────────────────────────  */}
<section className="analytics-section" id="analytics" aria-labelledby="analytics-heading">
  <div className="section-inner">
    <div className="reveal" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <div className="section-label">Analytics</div>
      <h2 id="analytics-heading" className="section-heading">Intelligence in<br/>every data point.</h2>
    </div>
    <div className="analytics-grid">
      <div className="chart-container reveal reveal-delay-1">
        <div className="chart-header">
          <div>
            <div className="chart-title">Exam Performance Distribution</div>
            <div className="chart-subtitle">Last 30 days · 2,847 sessions</div>
          </div>
          <div className="chart-legend">
            <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--accent)' }}></div>Pass</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--danger)' }}></div>Fail</div>
          </div>
        </div>
        <div className="chart-canvas-wrap">
          <canvas id="analyticsChart"></canvas>
        </div>
      </div>
      <div className="stats-list reveal reveal-delay-2">
        <div className="stat-row">
          <div className="stat-row-icon" style={{ background: 'rgba(79,70,229,.12)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ width: '18px', height: '18px' }}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          <div className="stat-row-label">Pass rate this semester</div>
          <div className="stat-row-val">84.2%</div>
          <div className="stat-row-change change-up">↑ 6.1%</div>
        </div>
        <div className="stat-row">
          <div className="stat-row-icon" style={{ background: 'rgba(34,197,94,.1)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" style={{ width: '18px', height: '18px' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div className="stat-row-label">Integrity incidents flagged</div>
          <div className="stat-row-val">0.03%</div>
          <div className="stat-row-change change-down">↓ 91%</div>
        </div>
        <div className="stat-row">
          <div className="stat-row-icon" style={{ background: 'rgba(59,130,246,.12)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" style={{ width: '18px', height: '18px' }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="stat-row-label">Avg. completion time</div>
          <div className="stat-row-val">52m</div>
          <div className="stat-row-change change-up">↑ On track</div>
        </div>
        <div className="stat-row">
          <div className="stat-row-icon" style={{ background: 'rgba(124,58,237,.12)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--violet)" strokeWidth="2" style={{ width: '18px', height: '18px' }}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </div>
          <div className="stat-row-label">AI-graded subjective answers</div>
          <div className="stat-row-val">18,432</div>
          <div className="stat-row-change change-up">↑ 24%</div>
        </div>
      </div>
    </div>
  </div>
</section>

{/*  ─────────────────────────── PRICING ───────────────────────────  */}
<section className="pricing-section" id="pricing" aria-labelledby="pricing-heading">
  <div className="section-inner">
    <div className="reveal" style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}>
      <div className="section-label">Pricing</div>
      <h2 id="pricing-heading" className="section-heading">Scale with confidence.</h2>
      <p className="section-body" style={{ margin: '0 auto' }}>Transparent, institution-aligned pricing with no hidden per-exam fees. Volume discounts available for national deployments.</p>
    </div>
    <div className="pricing-grid">
      <div className="pricing-card reveal reveal-delay-1">
        <div className="pricing-tier">Academic</div>
        <div className="pricing-price">$499<span>/mo</span></div>
        <div className="pricing-desc">For departments and smaller institutions running up to 5,000 exam sessions monthly.</div>
        <ul className="pricing-feats">
          <li><div className="pricing-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>Up to 5,000 sessions/month</li>
          <li><div className="pricing-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>MCQ, coding & subjective questions</li>
          <li><div className="pricing-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>AI anomaly detection</li>
          <li><div className="pricing-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>SEB integration</li>
          <li><div className="pricing-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>Standard analytics</li>
        </ul>
        <div className="pricing-cta-wrap">
          <button className="pricing-btn pricing-btn-ghost">Start free trial</button>
        </div>
      </div>
      <div className="pricing-card featured reveal reveal-delay-2">
        <div className="pricing-featured-tag">Most popular</div>
        <div className="pricing-tier">University</div>
        <div className="pricing-price">$1,999<span>/mo</span></div>
        <div className="pricing-desc">For full university deployments with multiple departments and concurrent exam delivery.</div>
        <ul className="pricing-feats">
          <li><div className="pricing-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>Unlimited sessions</li>
          <li><div className="pricing-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>Full AI suite including grading</li>
          <li><div className="pricing-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>Live monitoring command center</li>
          <li><div className="pricing-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>Advanced behavioral analytics</li>
          <li><div className="pricing-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>99.99% SLA + dedicated support</li>
          <li><div className="pricing-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>Custom branding & domain</li>
        </ul>
        <div className="pricing-cta-wrap">
          <button className="pricing-btn pricing-btn-solid">Get started</button>
        </div>
      </div>
      <div className="pricing-card reveal reveal-delay-3">
        <div className="pricing-tier">Government / Enterprise</div>
        <div className="pricing-price" style={{ fontSize: '42px' }}>Custom</div>
        <div className="pricing-desc">For governments, certification bodies, and national-scale deployments. Air-gapped options available.</div>
        <ul className="pricing-feats">
          <li><div className="pricing-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>Unlimited scale</li>
          <li><div className="pricing-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>On-premise deployment</li>
          <li><div className="pricing-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>Air-gapped & classified environments</li>
          <li><div className="pricing-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>White-label platform rights</li>
          <li><div className="pricing-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>Dedicated engineering team</li>
        </ul>
        <div className="pricing-cta-wrap">
          <button className="pricing-btn pricing-btn-ghost">Talk to sales</button>
        </div>
      </div>
    </div>
  </div>
</section>

{/*  ─────────────────────────── FAQ ───────────────────────────  */}
<section className="faq-section" id="faq" aria-labelledby="faq-heading">
  <div className="section-inner">
    <div className="reveal" style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
      <div className="section-label">FAQ</div>
      <h2 id="faq-heading" className="section-heading">Questions we hear from institutions.</h2>
    </div>
    <div className="faq-grid reveal reveal-delay-1">
      <div className="faq-item">
        <div className="faq-q" >
          How does SecureExam integrate with existing LMS platforms?
          <div className="faq-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg></div>
        </div>
        <div className="faq-a"><div className="faq-a-inner">SecureExam integrates natively with Moodle, Canvas, Blackboard, and Brightspace via LTI 1.3. Our API-first architecture means any custom LMS can connect through our REST or GraphQL endpoints. Data sync is real-time, bidirectional, and requires no manual exports.</div></div>
      </div>
      <div className="faq-item">
        <div className="faq-q" >
          What happens if a student loses internet connectivity mid-exam?
          <div className="faq-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg></div>
        </div>
        <div className="faq-a"><div className="faq-a-inner">Our offline-resilient client caches all responses locally and syncs automatically when connectivity is restored. Sessions are preserved for up to 15 minutes of disconnection. Proctors are alerted immediately with the connectivity event logged in the audit trail.</div></div>
      </div>
      <div className="faq-item">
        <div className="faq-q" >
          How accurate is the AI subjective answer grading?
          <div className="faq-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg></div>
        </div>
        <div className="faq-a"><div className="faq-a-inner">In independent benchmarks against expert human graders, our AI achieves 94.7% agreement on rubric-based assessments. All AI grades include a confidence score. Answers below 80% confidence are automatically queued for human review. Graders can override and the AI learns from corrections.</div></div>
      </div>
      <div className="faq-item">
        <div className="faq-q" >
          Is on-premise deployment available for sensitive environments?
          <div className="faq-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg></div>
        </div>
        <div className="faq-a"><div className="faq-a-inner">Yes. Our Government & Enterprise tier supports fully air-gapped on-premise deployment on your own infrastructure. We provide containerized deployment packages compatible with Kubernetes, Docker Swarm, and bare-metal installations. Dedicated professional services teams handle the deployment and ongoing maintenance.</div></div>
      </div>
      <div className="faq-item">
        <div className="faq-q" >
          How does the Safe Exam Browser integration work?
          <div className="faq-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg></div>
        </div>
        <div className="faq-a"><div className="faq-a-inner">SecureExam generates cryptographically signed SEB configuration files per exam. When students launch the SEB client, it validates the signature, locks the OS environment, and establishes a secure channel to our servers. The configuration enforces allowed URLs, disables screen recording, clipboard, and process switching at the OS level.</div></div>
      </div>
    </div>
  </div>
</section>

{/* ─────────────────────────── FOOTER ─────────────────────────── */}
<footer>
  <div className="section-inner">
    <div className="footer-grid">
      <div className="footer-brand">
        <div className="footer-logo">
          <div className="footer-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '18px', height: '18px'}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div className="footer-logo-name">SecureExam Enterprise</div>
        </div>
        <p className="footer-tagline">AI-powered examination infrastructure for universities, governments, and enterprise certification bodies worldwide.</p>
      </div>
      <div>
        <div className="footer-col-title">Product</div>
        <ul className="footer-links">
          <li><a></a></li>
          <li><a></a></li>
          <li><a></a></li>
          <li><a></a></li>
          <li><a></a></li>
          <li><a></a></li>
        </ul>
      </div>
      <div>
        <div className="footer-col-title">Security</div>
        <ul className="footer-links">
          <li><a></a></li>
          <li><a></a></li>
          <li><a></a></li>
          <li><a></a></li>
          <li><a></a></li>
        </ul>
      </div>
      <div>
        <div className="footer-col-title">Company</div>
        <ul className="footer-links">
          <li><a></a></li>
          <li><a></a></li>
          <li><a></a></li>
          <li><a></a></li>
          <li><a></a></li>
        </ul>
      </div>
    </div>
    <div className="footer-bottom">
      <div className="footer-copy">© 2025 SecureExam Enterprise. Built at GLA University, Mathura.</div>
      <div className="footer-badges">
        <div className="footer-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          SOC 2 Type II
        </div>
        <div className="footer-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          ISO 27001
        </div>
        <div className="footer-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
          GDPR
        </div>
      </div>
    </div>
  </div>
</footer>

    </div>
  );
}
