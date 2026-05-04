import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Bot, ChevronDown, ChevronRight, Search, Plus, Minus } from 'lucide-react';
import api from '../utils/api';

const COLLEGE_NAME = "AMC ENGINEERING COLLEGE"; // (Replaced by dynamic org)

// --- CUSTOM HOOKS ---

const useTypewriter = (text, speed = 60, delay = 0) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let timeout;
    let charIndex = 0;

    const startTyping = () => {
      setIsTyping(true);
      const interval = setInterval(() => {
        if (charIndex < text.length) {
          setDisplayText(text.slice(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, speed);
      return interval;
    };

    if (delay > 0) {
      timeout = setTimeout(() => {
        const interval = startTyping();
        timeout = interval;
      }, delay);
    } else {
      timeout = startTyping();
    }

    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return { displayText, isTyping };
};

const useCountUp = (endValue, duration = 1800) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;

    let startTime;
    const animate = (time) => {
      if (!startTime) startTime = time;
      const progress = time - startTime;
      const progressRatio = Math.min(progress / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progressRatio, 3);
      setCount(Math.floor(easeProgress * endValue));

      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };
    requestAnimationFrame(animate);
  }, [endValue, duration, isInView]);

  return { count, ref };
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// --- COMPONENTS ---

const SectionLabel = ({ text, align = 'left' }) => (
  <div className={`flex items-center gap-[6px] mb-4 ${align === 'center' ? 'justify-center' : 'justify-start'
    }`}>
    <div className="w-4 h-[1px] bg-primary"></div>
    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-primary">{text}</span>
  </div>
);

// Navbar handled by App layout

const HeroCard = () => {
  const { displayText, isTyping } = useTypewriter("Try restarting your network adapter. Go to Device Manager → Network Adapters → right click → Disable, then Enable.", 50, 1500);

  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="relative w-full max-w-[400px] glass-card p-5 rounded-2xl z-10 text-left border border-[rgba(99,102,241,0.2)] shadow-[0_0_40px_rgba(99,102,241,0.1)]"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm">RS</div>
        <div>
          <p className="text-[13px] font-medium text-white">Rahul Sharma raised a ticket</p>
          <p className="text-[11px] text-gray-400">Technical Issues • 2 mins ago</p>
        </div>
      </div>

      <div className="bg-[rgba(6,6,15,0.4)] border border-[rgba(99,102,241,0.2)] rounded-xl p-3 mb-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary opacity-5 pointer-events-none"></div>
        <p className="text-[10px] text-primary font-bold mb-1 flex items-center gap-1">⚡ AI Response</p>
        <p className="text-[11px] text-accent-text leading-[1.6]">
          {displayText}
          {isTyping && <span className="animate-pulse">|</span>}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="px-2 py-1 rounded-full bg-[rgba(99,102,241,0.15)] border border-[rgba(99,102,241,0.3)] text-[10px] text-accent-text font-medium">Open</span>
        <span className="px-2 py-1 rounded-full bg-[rgba(249,115,22,0.15)] border border-[rgba(249,115,22,0.3)] text-[10px] text-orange-400 font-medium">High Priority</span>
        <span className="px-2 py-1 rounded-full bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] text-[10px] text-emerald-400 font-medium">AI Handled</span>
      </div>
    </motion.div>
  );
};

const StatItem = ({ endValue, suffix, label, colorClass }) => {
  const { count, ref } = useCountUp(endValue);

  return (
    <div ref={ref} className="glass-card p-5 flex flex-col justify-center items-center text-center">
      <div className={`text-[28px] font-extrabold bg-clip-text text-transparent bg-gradient-to-br ${colorClass}`}>
        {count}{suffix}
      </div>
      <p className="text-[11px] mt-1 text-gray-400 font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
};

import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { user } = useAuth();
  const orgName = user?.organizationName || 'Your Organization';
  const { displayText: heroLine1, isTyping: isTyping1 } = useTypewriter(orgName, 60, 0);

  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);

  const [faqs, setFaqs] = useState([]);
  const [searchFaq, setSearchFaq] = useState('');
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const debouncedSearchFaq = useDebounce(searchFaq, 300);

  const [openFaqId, setOpenFaqId] = useState(null);

  useEffect(() => {
    // Add smooth scroll to html
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => { document.documentElement.style.scrollBehavior = 'auto'; };
  }, []);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const noticesRes = await api.get('/notices');
        setNotices(noticesRes.data.notices?.slice(0, 3) || []);
      } catch (err) { console.error(err); }
      finally { setLoadingNotices(false); }

      try {
        const faqsRes = await api.get('/faqs');
        setFaqs(faqsRes.data.faqs || []);
      } catch (err) { console.error(err); }
      finally { setLoadingFaqs(false); }
    };
    fetchPublicData();
  }, []);

  const filteredFaqs = faqs.filter(f =>
    f.question.toLowerCase().includes(debouncedSearchFaq.toLowerCase()) ||
    f.answer.toLowerCase().includes(debouncedSearchFaq.toLowerCase())
  ).slice(0, 4);

  return (
    <div className="relative overflow-hidden w-full">
      {/* SECTION 1 - HERO */}
      <section className="relative min-h-screen flex items-center z-10 px-4 py-20">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-center lg:text-left"
            >
              {/* College Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.3)] text-[13px] font-semibold text-accent-text mb-5 tracking-wide">
                <span className="text-xl">
                  {user?.organizationType === 'college' ? '🎓' : user?.organizationType === 'company' ? '🏢' : '🏫'}
                </span>
                {orgName}
              </div>

              <div className="flex justify-center lg:justify-start mb-4">
                <SectionLabel text="AI Powered Support" align="left" />
              </div>

              <h1 className="text-[clamp(32px,4.5vw,56px)] font-extrabold leading-[1.1] mb-6">
                <span className="block">
                  {heroLine1}{isTyping1 && <span className="animate-pulse text-primary">|</span>}
                </span>
                <span className="block text-gradient mt-1">Smart Helpdesk</span>
                <span className="block mt-1">Powered by AI</span>
              </h1>

              <p className="text-[15px] text-gray-400 max-w-[480px] mx-auto lg:mx-0 mb-8 leading-relaxed">
                Raise tickets, get instant AI solutions, track status in real time.{' '}
                {user?.organizationType === 'college' 
                  ? "Built for students, staff and administration." 
                  : user?.organizationType === 'company'
                  ? "Built for employees and management."
                  : "Built for your organization."}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-6">
                <Link to={user ? "/dashboard" : "/auth"} className="btn-primary w-full sm:w-auto">
                  {user ? "Go to Dashboard" : "Get Started Free"}
                </Link>
                <a href="#features" className="btn-ghost w-full sm:w-auto">
                  View Demo
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-[12px] text-[#7c6fa0] font-medium">
                <span>✓ Free for students</span>
                <span>•</span>
                <span>✓ Instant AI response</span>
                <span>•</span>
                <span>✓ Secure &amp; private</span>
              </div>
            </motion.div>

            {/* Right: Hero Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex justify-center lg:justify-end"
            >
              <HeroCard />
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 2 - STATS */}
      <section id="stats" className="relative z-10 max-w-5xl mx-auto px-4 py-[60px]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatItem endValue={1200} suffix="+" label="Students Helped" colorClass="from-primary to-accent-text" />
          <StatItem endValue={500} suffix="+" label="Tickets Resolved" colorClass="from-orange-500 to-orange-300" />
          <StatItem endValue={2} suffix="hr>" label="Avg Response Time" colorClass="from-emerald-500 to-emerald-300" />
          <StatItem endValue={50} suffix="+" label="FAQs Available" colorClass="from-primary to-secondary" />
        </div>
      </section>

      {/* SECTION 3 - FEATURES */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 py-[80px]">
        <SectionLabel text="What We Offer" />
        <h2 className="text-3xl font-bold mb-2">Everything your organization needs</h2>
        <p className="text-[14px] text-[#7c6fa0] mb-12">One platform for all support needs</p>

        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {[
            { icon: "🤖", color: "indigo", title: "AI Smart Support", desc: "Gemini AI instantly analyses and resolves common issues without waiting for staff response." },
            { icon: "🎫", color: "orange", title: "Ticket Tracking", desc: "Raise, track and manage support tickets with real-time status updates and notifications." },
            { icon: "📢", color: "emerald", title: "Notice Board", desc: "Stay updated with college announcements, exam schedules and important notices instantly." },
            { icon: "❓", color: "indigo", title: "FAQ System", desc: "Browse categorised answers to common questions. Can't find it? Raise a ticket in one click." },
            { icon: "🔐", color: "orange", title: "Role Based Access", desc: "Separate dashboards and permissions for Students, Staff and Admin roles." },
            { icon: "⚡", color: "emerald", title: "Smart Escalation", desc: "Sensitive issues like harassment are auto-flagged Critical and instantly notified to admin." }
          ].map((feat, i) => {
            const bgMap = {
              indigo: 'bg-[rgba(99,102,241,0.15)] text-[#8b5cf6]',
              orange: 'bg-[rgba(249,115,22,0.15)] text-[#f97316]',
              emerald: 'bg-[rgba(16,185,129,0.15)] text-[#10b981]'
            };
            return (
              <motion.div 
                key={i}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                className="glass-card p-6"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg mb-4 ${bgMap[feat.color]}`}>
                  {feat.icon}
                </div>
                <h3 className={`text-[14px] font-semibold mb-2 ${feat.color === 'indigo' ? 'text-[#c4b5fd]' : feat.color === 'orange' ? 'text-[#fb923c]' : 'text-[#34d399]'}`}>
                  {feat.title}
                </h3>
                <p className="text-[12px] text-[#7c6fa0] leading-[1.6]">{feat.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* SECTION 4 - HOW IT WORKS */}
      <section id="how-it-works" className="relative z-10 max-w-2xl mx-auto px-4 py-[80px]">
        <SectionLabel text="Simple Process" />
        <h2 className="text-3xl font-bold mb-2">How it works</h2>
        <p className="text-[14px] text-[#7c6fa0] mb-12">Resolved in 3 simple steps</p>

        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
          className="space-y-8 relative"
        >
          {/* Vertical Line */}
          <div className="absolute left-[20px] top-4 bottom-4 w-[1px] bg-gradient-to-b from-primary via-orange-500 to-emerald-500 opacity-30 z-0 hidden sm:block"></div>

          {[
            { num: "1", color: "indigo", title: "Describe your issue", desc: "Fill in the ticket form with your problem title, description and category. Takes less than a minute.", tag: "Technical / Academic / Welfare" },
            { num: "2", color: "orange", title: "AI instantly analyses", desc: "Google Gemini AI reads your issue, checks the category and generates a solution or escalates to staff.", tag: "Response in seconds" },
            { num: "3", color: "emerald", title: "Get your solution", desc: "Simple issues solved by AI instantly. Complex ones tracked by staff with real-time notifications to you.", tag: "Notified every step" }
          ].map((step, i) => {
            const colorMap = {
              indigo: 'from-primary to-secondary shadow-[0_0_15px_rgba(99,102,241,0.4)]',
              orange: 'from-orange-500 to-red-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]',
              emerald: 'from-emerald-500 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
            };
            return (
              <motion.div key={i} variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }} className="relative z-10 flex flex-col sm:flex-row gap-6 items-start">
                <div className={`w-10 h-10 shrink-0 rounded-full bg-gradient-to-br ${colorMap[step.color]} flex items-center justify-center text-white font-bold`}>
                  {step.num}
                </div>
                <div className="glass-card p-5 flex-1 w-full text-left">
                  <h3 className="text-[16px] font-bold text-[#f1f0ff] mb-2">{step.title}</h3>
                  <p className="text-[13px] text-[#7c6fa0] leading-relaxed mb-4">{step.desc}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#c4b5fd]`}>
                    {step.tag}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* SECTION 5 - SAFETY & SUPPORT */}
      <section id="safety" className="relative z-10 max-w-6xl mx-auto px-4 py-[80px]" style={{ background: 'rgba(239,68,68,0.02)' }}>
  <SectionLabel text="Safety First" />
  <h2 className="text-3xl font-bold mb-2" style={{ color: '#fecaca' }}>We take your safety seriously</h2>
  <p className="text-[14px] text-[#7c6fa0] mb-12">Sensitive issues are instantly flagged and handled by our team with complete confidentiality.</p>
<motion.div
initial="hidden"
whileInView="show"
viewport={{ once: true, margin: "-50px" }}
variants={{
hidden: {},
show: { transition: { staggerChildren: 0.12 } }
}}
className="space-y-6"
>


{[
  {
    title: "Harassment Complaint Received",
    category: "STUDENT WELFARE & COMPLAINTS",
    desc: "A sensitive complaint regarding harassment has been received and automatically flagged as CRITICAL. Our admin team has been instantly notified.",
    timeline: [
      { dot: "#ef4444", text: "Complaint received & flagged CRITICAL", time: "Just now" },
      { dot: "#fbbf24", text: "Automatically escalated to admin", time: "Within 30 seconds" },
      { dot: "#06b6d4", text: "Admin team will contact you", time: "Within 24 hours" }
    ]
  },
  {
    title: "Ragging/Bullying Complaint",
    category: "STUDENT WELFARE & COMPLAINTS",
    desc: "A complaint regarding ragging or bullying has been reported. Campus security and administration have been alerted immediately.",
    timeline: [
      { dot: "#ef4444", text: "Complaint received & flagged CRITICAL", time: "Just now" },
      { dot: "#fbbf24", text: "Security alerted immediately", time: "Within 2 minutes" },
      { dot: "#06b6d4", text: "Investigation & resolution", time: "Within 48 hours" }
    ]
  },
  {
    title: "Fight/Violence Incident",
    category: "STUDENT WELFARE & COMPLAINTS",
    desc: "Reports of physical altercation have been received. Escalated to campus security, medical services, and administration immediately.",
    timeline: [
      { dot: "#ef4444", text: "Incident reported & flagged CRITICAL", time: "Just now" },
      { dot: "#fbbf24", text: "Security & medical alerted", time: "Within 1 minute" },
      { dot: "#06b6d4", text: "Admin handling & follow-up", time: "Within 24 hours" }
    ]
  }
].map((card, i) => (
  <motion.div 
    key={i}
    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
    className="rounded-2xl p-6 border-t-2 transition-all hover:shadow-lg"
    style={{
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.2)',
      borderTop: '2px solid #ef4444'
    }}
  >
    <div className="flex flex-wrap gap-2 mb-4">
      <span className="px-3 py-1 rounded-full text-[9px] font-bold text-white" style={{ background: 'rgba(239,68,68,0.5)', border: '1px solid rgba(239,68,68,0.8)' }}>
        🚨 CRITICAL PRIORITY
      </span>
      <span className="px-3 py-1 rounded-full text-[9px] font-bold" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
        Auto-Escalated
      </span>
      <span className="px-3 py-1 rounded-full text-[9px] font-bold" style={{ background: 'rgba(34,211,238,0.15)', color: '#67e8f9', border: '1px solid rgba(34,211,238,0.3)' }}>
        Admin Notified
      </span>
    </div>

    <h3 className="text-[14px] font-bold mb-2 flex items-center gap-2" style={{ color: '#fecaca' }}>
      <span className="animate-pulse text-lg">⚡</span>
      {card.title}
    </h3>

    <p className="text-[10px] font-bold uppercase tracking-wide mb-3" style={{ color: '#ef4444' }}>
      {card.category}
    </p>

    <p className="text-[12px] leading-relaxed mb-6" style={{ color: '#fca5a5' }}>
      {card.desc}
    </p>

    <div className="space-y-3 border-t border-[rgba(239,68,68,0.2)] pt-4">
      {card.timeline.map((item, j) => (
        <div key={j} className="flex gap-3 items-start">
          <div 
            className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" 
            style={{ background: item.dot }}
          ></div>
          <div className="flex-1">
            <p className="text-[11px] font-medium" style={{ color: '#fca5a5' }}>
              {item.text}
            </p>
            <p className="text-[10px]" style={{ color: '#7c6fa0' }}>
              {item.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  </motion.div>
))}
</motion.div>
  <div className="mt-8 p-4 rounded-xl text-center" style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.25)' }}>
    <p className="text-[11px]" style={{ color: '#a5f3fc' }}>
      📞 Need immediate help? Contact campus security hotline: <strong>+91-80-XXXX-XXXX</strong><br />
      or email <strong>admin@yourcollege.edu</strong>
    </p>
  </div>
      </section>

      {/* ======================================== */}
      {/* SECTION 6 - EVENTS & ACTIVITIES */}
      {/* ======================================== */}
<section id="events" className="relative z-10 max-w-6xl mx-auto px-4 py-[80px]">
  <SectionLabel text="Campus Life" />
  <h2 className="text-3xl font-bold mb-2">Upcoming Events & Activities</h2>
  <p className="text-[14px] text-[#7c6fa0] mb-12">Stay updated with college events, workshops, competitions and activities.</p>
<motion.div
initial="hidden"
whileInView="show"
viewport={{ once: true, margin: "-50px" }}
variants={{
hidden: {},
show: { transition: { staggerChildren: 0.08 } }
}}
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-8"
>


{[
  {
    date: "May 15",
    type: "Workshop",
    title: "Advanced Python Programming",
    desc: "Learn advanced concepts including decorators, generators, and async programming.",
    location: "Lab 3",
    time: "2:00 PM - 4:00 PM",
    attendees: 127,
    color: "indigo"
  },
  {
    date: "May 18",
    type: "Seminar",
    title: "AI in College Administration",
    desc: "Understand how AI systems like SmartDesk are transforming college support services.",
    location: "Main Auditorium",
    time: "3:00 PM - 5:00 PM",
    attendees: 89,
    color: "orange"
  },
  {
    date: "May 22",
    type: "Competition",
    title: "Coding Competition 2025",
    desc: "Compete with peers to solve real-world coding problems. Win exciting prizes!",
    location: "Computer Lab",
    time: "10:00 AM - 1:00 PM",
    attendees: 203,
    color: "emerald"
  },
  {
    date: "May 25",
    type: "Networking",
    title: "Industry Expert Talk",
    desc: "Meet and network with professionals from top tech companies. Q&A included.",
    location: "Conference Room",
    time: "4:00 PM - 6:00 PM",
    attendees: 156,
    color: "violet"
  }
].map((event, i) => {
  const colorMap = {
    indigo: { bg: 'rgba(99,102,241,0.07)', border: 'rgba(99,102,241,0.2)', accent: '#6366f1', text: '#c4b5fd', badge: '#a78bfa' },
    orange: { bg: 'rgba(249,115,22,0.07)', border: 'rgba(249,115,22,0.2)', accent: '#f97316', text: '#fb923c', badge: '#fb923c' },
    emerald: { bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.2)', accent: '#10b981', text: '#34d399', badge: '#34d399' },
    violet: { bg: 'rgba(139,92,246,0.07)', border: 'rgba(139,92,246,0.2)', accent: '#8b5cf6', text: '#c4b5fd', badge: '#a78bfa' }
  };
  const colors = colorMap[event.color];

  return (
    <motion.div 
      key={i}
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      className="rounded-2xl p-6 transition-all hover:shadow-lg hover:scale-[1.02]"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderLeft: `3px solid ${colors.accent}`
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <span className="px-3 py-1 rounded-full text-[10px] font-bold" style={{ background: `${colors.accent}20`, color: colors.text }}>
          {event.date}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: colors.accent }}>
          {event.type}
        </span>
      </div>

      <h3 className="text-[14px] font-semibold mb-2" style={{ color: colors.text }}>
        {event.title}
      </h3>

      <p className="text-[11px] text-[#7c6fa0] leading-relaxed mb-4">
        {event.desc}
      </p>

      <div className="space-y-2 text-[10px] text-[#7c6fa0] mb-4">
        <div>🏢 {event.location}</div>
        <div>🕐 {event.time}</div>
        <div>👥 {event.attendees} students registered</div>
      </div>

      <button className="w-full py-2 px-4 rounded-lg text-[11px] font-bold transition-all" style={{ background: `${colors.accent}20`, color: colors.text, border: `1px solid ${colors.accent}40` }}>
        Register
      </button>
    </motion.div>
  );
})}
</motion.div>
  <div className="text-center">
    <Link to="/events" className="text-[12px] font-bold text-[#6366f1] hover:text-[#8b5cf6] transition-colors inline-flex items-center gap-1">
      View all events <ChevronRight size={14} />
    </Link>
  </div>
      </section>

      {/* ======================================== */}
      {/* SECTION 7 - EDUCATION UPDATES */}
      {/* ======================================== */}
<section id="updates" className="relative z-10 max-w-4xl mx-auto px-4 py-[80px]">
  <SectionLabel text="Learn & Grow" />
  <h2 className="text-3xl font-bold mb-2" style={{ color: '#34d399' }}>Educational Resources & Updates</h2>
  <p className="text-[14px] text-[#7c6fa0] mb-12">Important updates, course announcements and learning resources from the college.</p>
<motion.div
initial="hidden"
whileInView="show"
viewport={{ once: true, margin: "-50px" }}
variants={{
hidden: {},
show: { transition: { staggerChildren: 0.1 } }
}}
className="space-y-4 mb-8"
>


{[
  {
    category: "Academic",
    categoryColor: { bg: 'rgba(16,185,129,0.2)', text: '#34d399' },
    date: "May 1, 2025",
    title: "New Semester Course Catalog Released",
    desc: "The course catalog for the next semester is now available. Browse 50+ courses and plan your schedule. Registrations open May 15.",
    link: "View Catalog"
  },
  {
    category: "Resource",
    categoryColor: { bg: 'rgba(99,102,241,0.15)', text: '#60a5fa' },
    date: "April 28, 2025",
    title: "Free Online Learning Resources Available",
    desc: "The library now provides access to LinkedIn Learning, Coursera for Campus, and 100+ educational platforms. Use your college email.",
    link: "Access Resources"
  },
  {
    category: "Announcement",
    categoryColor: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
    date: "April 25, 2025",
    title: "Midterm Exam Schedule Finalized",
    desc: "The midterm examination schedule has been finalized. Classes suspended June 1-15. Full schedule available on student portal.",
    link: "View Schedule"
  }
].map((update, i) => (
  <motion.div 
    key={i}
    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
    className="rounded-2xl p-6 transition-all hover:shadow-lg"
    style={{
      background: 'rgba(16,185,129,0.07)',
      border: '1px solid rgba(16,185,129,0.15)',
      borderLeft: '3px solid #10b981'
    }}
  >
    <div className="flex justify-between items-start mb-3">
      <span className="px-3 py-1 rounded-full text-[9px] font-bold" style={{ background: update.categoryColor.bg, color: update.categoryColor.text }}>
        {update.category}
      </span>
      <span className="text-[10px] text-[#7c6fa0]">{update.date}</span>
    </div>

    <h3 className="text-[14px] font-semibold mb-2" style={{ color: '#34d399' }}>
      {update.title}
    </h3>

    <p className="text-[12px] text-[#7c6fa0] leading-relaxed mb-4">
      {update.desc}
    </p>

    <a href="#" className="text-[11px] font-bold text-[#10b981] hover:text-[#34d399] transition-colors">
      {update.link} →
    </a>
  </motion.div>
))}
</motion.div>
  <div className="text-center">
    <Link to="/updates" className="text-[12px] font-bold text-[#10b981] hover:text-[#34d399] transition-colors inline-flex items-center gap-1">
      View all updates <ChevronRight size={14} />
    </Link>
  </div>
      </section>

      {/* SECTION 8 - ROLES */}
      <section id="roles" className="relative z-10 max-w-6xl mx-auto px-4 py-[60px]">
        <SectionLabel text="Built For Everyone" />
        <h2 className="text-3xl font-bold mb-10">Who uses SmartDesk</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "🎓", title: "Students", points: ["Raise tickets", "Track status", "Browse FAQs", "Get AI help"], linkText: "Register as Student", color: "indigo", border: "rgba(99,102,241,0.3)" },
            { icon: "👨‍🏫", title: "Staff", points: ["Manage tickets", "Reply to students", "Post notices", "Approve FAQs"], linkText: "Staff Login", color: "orange", border: "rgba(249,115,22,0.3)" },
            { icon: "🛡️", title: "Admin", points: ["Full control", "Manage users", "View all tickets", "System settings"], linkText: "Admin Portal", color: "emerald", border: "rgba(16,185,129,0.3)" }
          ].map((role, i) => (
            <div key={i} className="glass-card p-6 flex flex-col items-center text-center">
              <div className="text-4xl mb-4">{role.icon}</div>
              <h3 className="text-xl font-bold mb-4">{role.title}</h3>
              <div className="flex flex-col gap-2 mb-8 text-[13px] text-[#7c6fa0]">
                {role.points.map((p, j) => (
                  <div key={j} className="flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></span>
                    {p}
                  </div>
                ))}
              </div>
              <Link to="/auth" className="mt-auto px-6 py-2 rounded-xl text-[12px] font-bold bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)] transition-colors w-full">
                {role.linkText}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 9 - NOTICES */}
      <section id="notices" className="relative z-10 max-w-4xl mx-auto px-4 py-[60px]">
        <SectionLabel text="Latest Updates" />
        <h2 className="text-3xl font-bold mb-8">Recent notices</h2>

        <div className="space-y-4">
          {loadingNotices ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-[80px] glass-card"></div>)}
            </div>
          ) : notices.length > 0 ? (
            notices.map((n, i) => {
              const colors = ["#6366f1", "#f97316", "#10b981"];
              const color = colors[i % colors.length];
              return (
                <div key={n._id || i} className="group flex" style={{ borderLeft: `3px solid ${color}` }}>
                  <div className="flex-1 p-4 bg-[rgba(255,255,255,0.02)] border-y border-r border-[rgba(255,255,255,0.05)] rounded-r-xl group-hover:bg-[rgba(255,255,255,0.04)] transition-colors" style={{ backgroundColor: `${color}10` }}>
                    <h3 className="text-[13px] font-semibold text-[#f1f0ff] mb-1">{n.title}</h3>
                    <p className="text-[10px] text-[#7c6fa0] mb-2">{new Date(n.createdAt).toLocaleDateString()}</p>
                    <p className="text-[12px] text-[#a78bfa] truncate opacity-80">{n.description.substring(0, 100)}...</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 glass-card text-[13px] text-[#7c6fa0]">No notices yet</div>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <Link to="/notices" className="text-[12px] font-bold text-[#6366f1] hover:text-[#8b5cf6] transition-colors inline-flex items-center gap-1">
            View all notices <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* SECTION 10 - FAQS */}
      <section id="faqs" className="relative z-10 max-w-3xl mx-auto px-4 py-[60px]">
        <SectionLabel text="Quick Answers" />
        <h2 className="text-3xl font-bold mb-8">Frequently asked questions</h2>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7c6fa0]" size={16} />
          <input 
            type="text" 
            placeholder="Search FAQs..." 
            value={searchFaq}
            onChange={(e) => setSearchFaq(e.target.value)}
            className="w-full h-12 pl-11 pr-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(99,102,241,0.2)] rounded-xl text-[13px] text-white focus:outline-none focus:border-[#6366f1] transition-colors"
          />
        </div>

        <div className="space-y-3 mb-8">
          {loadingFaqs ? (
             <div className="animate-pulse space-y-3">
               {[1, 2, 3].map(i => <div key={i} className="h-12 glass-card"></div>)}
             </div>
          ) : filteredFaqs.length > 0 ? (
            filteredFaqs.map(faq => {
              const isOpen = openFaqId === faq._id;
              return (
                <div key={faq._id} className="glass-card overflow-hidden">
                  <button 
                    onClick={() => setOpenFaqId(isOpen ? null : faq._id)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left"
                  >
                    <span className="text-[13px] font-medium text-[#c4b5fd] pr-4">{faq.question}</span>
                    <span className="text-[#6366f1] shrink-0">{isOpen ? <Minus size={16} /> : <Plus size={16} />}</span>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-5 pb-4 text-[12px] text-[#7c6fa0] leading-[1.7]">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-[13px] text-[#7c6fa0]">No FAQs matched your search</div>
          )}
        </div>

        <div className="text-center mb-10">
          <Link to="/faqs" className="text-[12px] font-bold text-[#6366f1] hover:text-[#8b5cf6] transition-colors inline-flex items-center gap-1">
            Browse all FAQs <ChevronRight size={14} />
          </Link>
        </div>

        <div className="glass-card p-6 text-center bg-white/5 border-dashed border-white/20">
          <p className="text-[14px] font-medium text-[#f1f0ff] mb-4">Didn't find your answer?</p>
          <Link to="/auth" className="inline-flex items-center px-6 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[12px] font-bold hover:bg-[rgba(255,255,255,0.1)] transition-colors">
            Raise a Ticket
          </Link>
        </div>
      </section>

      {/* SECTION 11 - CTA */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 py-[80px]">
    <div className="relative overflow-hidden rounded-[20px] p-8 sm:p-12 text-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.3)' }}>
      {/* Internal blobs */}
      <div className="absolute top-[-50px] left-[-50px] w-[200px] h-[200px] bg-primary rounded-full blur-[80px] opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-[-50px] right-[-50px] w-[200px] h-[200px] bg-secondary rounded-full blur-[80px] opacity-30 pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex justify-center"><SectionLabel text="Ready to Start" /></div>
        <h2 className="text-[28px] sm:text-[36px] font-bold mb-4">Get instant support <span className="landing-gradient-text">right now</span></h2>
        <p className="text-[14px] text-accent-text max-w-[400px] mx-auto mb-8 leading-relaxed">
          Join thousands already using SmartDesk. Register with your organization and get AI-powered support in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link to={user ? "/dashboard" : "/auth"} className="btn-primary w-full sm:w-auto">
            {user ? "Go to Dashboard" : "Get Started Free"}
          </Link>
          {!user && (
            <Link to="/auth" className="btn-ghost w-full sm:w-auto">
              Login
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#7c6fa0] font-medium">
          <span>✓ Free to use</span>
          <span className="hidden sm:inline">•</span>
          <span>✓ No setup required</span>
          <span className="hidden sm:inline">•</span>
          <span>✓ Instant AI support</span>
        </div>
      </div>
    </div>
      </section>

      {/* SECTION 12 - FOOTER */}
      <footer className="relative z-10 border-t border-[rgba(99,102,241,0.12)] bg-[rgba(6,6,15,0.8)] pt-[40px] pb-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8 mb-10">
          <div className="max-w-[250px]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xs">H</div>
              <span className="font-bold text-sm bg-clip-text text-transparent bg-gradient-to-br from-accent-text to-blue-400">SmartDesk</span>
            </div>
            <p className="text-[11px] text-[#7c6fa0]">Smart Helpdesk System — {orgName}</p>
          </div>
          
          <div className="hidden md:flex flex-col gap-2">
            <p className="text-[12px] font-bold text-[#f1f0ff] mb-1">Navigation</p>
            {['Home', 'Features', 'How it Works', 'Notices', 'FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="text-[11px] text-[#7c6fa0] hover:text-accent-text transition-colors">{item}</a>
            ))}
          </div>

          <div className="hidden md:flex flex-col gap-2">
            <p className="text-[12px] font-bold text-[#f1f0ff] mb-1">Quick Access</p>
            {['Student Login', 'Staff Login', 'Register'].map(item => (
              <Link key={item} to={user ? "/dashboard" : "/auth"} className="text-[11px] text-[#7c6fa0] hover:text-accent-text transition-colors">{item}</Link>
            ))}
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto border-t border-[rgba(255,255,255,0.05)] pt-6 text-center">
          <p className="text-[10px] text-[#3d3660]">© 2025 SmartDesk • {orgName} • All rights reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
