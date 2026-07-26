import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, ArrowRight } from 'lucide-react';


const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!name.trim()) { setError('Please enter your name'); return; }
    setIsLoading(true);
    try {
      await register(name, email, password, role);
      navigate(role === 'teacher' ? '/teacher' : '/student');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[var(--bg-primary)]">
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))', boxShadow: '0 0 40px color-mix(in srgb, var(--accent-purple) 40%, transparent)' }}>
            <Shield size={24} className="text-heading" />
          </div>
          <h1 className="text-2xl font-black text-heading">SecureExam</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Enterprise Assessment Platform</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-hover)', backdropFilter: 'blur(24px)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
          <h2 className="text-xl font-bold text-heading mb-1">Create account</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Set up your SecureExam account</p>

          {/* Role tabs */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-xl" style={{ background: 'var(--bg-card)' }}>
            {(['student', 'teacher'] as const).map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className="py-2.5 px-4 rounded-lg text-sm font-bold capitalize transition-all duration-200"
                style={{ background: role === r ? 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))' : 'transparent', color: role === r ? '#fff' : 'var(--text-secondary)', boxShadow: role === r ? '0 4px 20px color-mix(in srgb, var(--accent-purple) 30%, transparent)' : 'none' }}>
                {r === 'student' ? '👨‍🎓 Student' : '👨‍🏫 Instructor'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full name', value: name, setter: setName, type: 'text', placeholder: 'John Smith' },
              { label: 'Email address', value: email, setter: setEmail, type: 'email', placeholder: 'you@company.com' },
            ].map(({ label, value, setter, type, placeholder }) => (
              <div key={label}>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                <input type={type} value={value} onChange={e => setter(e.target.value)} placeholder={placeholder} required className="input-dark" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters" required className="input-dark pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Confirm password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required className="input-dark" />
            </div>

            {error && (
              <div className="p-3 rounded-xl text-xs font-medium" style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.2)', color: 'var(--tint-rose-text)' }}>{error}</div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all mt-2"
              style={{ background: isLoading ? 'color-mix(in srgb, var(--accent-purple) 50%, transparent)' : 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))', boxShadow: isLoading ? 'none' : '0 4px 24px color-mix(in srgb, var(--accent-purple) 35%, transparent)', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
              {isLoading ? <><div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Creating account...</> : <>Create account <ArrowRight size={15} /></>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
            <Link to="/login" className="text-sm font-semibold" style={{ color: 'var(--tint-purple-text)' }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;