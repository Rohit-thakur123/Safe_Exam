import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, BarChart3, Plus, ListChecks, FileText, Eye,
  Code2, BookOpen, LogOut, Menu, X, ChevronDown, Bell, Settings
} from 'lucide-react';

const NAV_LINKS = [
  { to: '/teacher', label: 'Overview', icon: BarChart3, exact: true },
  { to: '/teacher/exams', label: 'Assessments', icon: Eye },
  { to: '/teacher/mcq', label: 'MCQ Library', icon: ListChecks },
  { to: '/teacher/coding-questions', label: 'Coding', icon: Code2 },
  { to: '/teacher/subjective-questions', label: 'Subjective', icon: BookOpen },
];

const CREATE_LINKS = [
  { to: '/teacher/create-question', label: 'New MCQ Question', icon: Plus },
  { to: '/teacher/coding-questions/create', label: 'New Coding Challenge', icon: Code2 },
  { to: '/teacher/subjective-questions/create', label: 'New Subjective', icon: BookOpen },
  { to: '/teacher/create-exam', label: 'New Assessment', icon: FileText },
];

export const TeacherNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setCreateOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (to: string, exact = false) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AN';

  return (
    <>
      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? 'rgba(10,10,15,0.95)'
            : 'rgba(10,10,15,0.7)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Brand */}
            <Link to="/teacher" className="flex items-center gap-3 group flex-shrink-0">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  boxShadow: '0 0 20px rgba(139,92,246,0.4)',
                }}
              >
                <Shield size={17} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white leading-none">SecureExam</div>
                <div className="text-[10px] font-medium leading-none mt-1" style={{ color: '#8b5cf6' }}>
                  Enterprise Console
                </div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1 mx-8">
              {NAV_LINKS.map(({ to, label, icon: Icon, exact }) => {
                const active = isActive(to, exact);
                return (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative"
                    style={{
                      color: active ? '#a78bfa' : 'rgba(240,240,245,0.55)',
                      background: active ? 'rgba(139,92,246,0.12)' : 'transparent',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.color = 'rgba(240,240,245,0.9)';
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.color = 'rgba(240,240,245,0.55)';
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }
                    }}
                  >
                    <Icon size={15} />
                    {label}
                    {active && (
                      <span
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full"
                        style={{ background: '#8b5cf6' }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Create dropdown */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setCreateOpen(!createOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                  style={{
                    background: createOpen
                      ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                      : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    boxShadow: '0 2px 20px rgba(139,92,246,0.3)',
                  }}
                >
                  <Plus size={15} />
                  Create
                  <ChevronDown size={13} className={`transition-transform ${createOpen ? 'rotate-180' : ''}`} />
                </button>

                {createOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setCreateOpen(false)} />
                    <div
                      className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-50 py-2"
                      style={{
                        background: 'rgba(15,15,23,0.98)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(24px)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1)',
                      }}
                    >
                      {CREATE_LINKS.map(({ to, label, icon: Icon }) => (
                        <Link
                          key={to}
                          to={to}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                          style={{ color: 'rgba(240,240,245,0.7)' }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.color = '#fff';
                            (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.12)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.color = 'rgba(240,240,245,0.7)';
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                          }}
                        >
                          <Icon size={14} style={{ color: '#8b5cf6' }} />
                          {label}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="hidden sm:block h-6 w-px mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />

              {/* User avatar */}
              <div className="hidden sm:flex items-center gap-2.5">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
                >
                  {initials}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-semibold text-white leading-none">{user?.name}</div>
                  <div className="text-[10px] mt-0.5 capitalize" style={{ color: 'rgba(240,240,245,0.4)' }}>
                    Instructor
                  </div>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
                style={{ color: 'rgba(240,240,245,0.4)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color = '#fb7185';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(244,63,94,0.08)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(240,240,245,0.4)';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <LogOut size={14} />
                <span className="hidden lg:inline">Sign out</span>
              </button>

              {/* Mobile toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-xl transition-colors"
                style={{ color: 'rgba(240,240,245,0.6)', background: 'rgba(255,255,255,0.05)' }}
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div
            className="lg:hidden border-t px-4 py-4 space-y-1"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(10,10,15,0.98)' }}
          >
            {NAV_LINKS.map(({ to, label, icon: Icon, exact }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium"
                style={{
                  color: isActive(to, exact) ? '#a78bfa' : 'rgba(240,240,245,0.6)',
                  background: isActive(to, exact) ? 'rgba(139,92,246,0.12)' : 'transparent',
                }}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
            <div className="pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {CREATE_LINKS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium"
                  style={{ color: 'rgba(240,240,245,0.5)' }}
                >
                  <Icon size={14} style={{ color: '#8b5cf6' }} />
                  {label}
                </Link>
              ))}
            </div>
            <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-xs" style={{ color: 'rgba(240,240,245,0.3)' }}>{user?.email}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ color: '#fb7185', background: 'rgba(244,63,94,0.1)' }}
              >
                <LogOut size={13} /> Sign out
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default TeacherNavbar;