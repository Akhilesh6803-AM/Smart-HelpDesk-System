import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, GraduationCap, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import Spinner from '../components/Spinner';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    usn: '',
    employeeId: '',
    password: '',
    identifier: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
    // Clear field-level error when user types
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: '' });
    }
  };

  const validate = () => {
    const errors = {};
    if (isLogin) {
      if (!formData.identifier) errors.identifier = 'Identifier is required';
      if (!formData.password) errors.password = 'Password is required';
    } else {
      if (!formData.name) errors.name = 'Full name is required';
      if (!formData.email) errors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Enter a valid email';
      if (!formData.password) errors.password = 'Password is required';
      else if (formData.password.length < 8) errors.password = 'Min 8 characters';
      if (role === 'student') {
        const usnPattern = /^[0-9]{1}[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$/;

        if (!formData.usn) {
          errors.usn = 'USN is required';
        }
        else if (formData.usn.length !== 10) {
          errors.usn = 'USN must be exactly 10 characters';
        }
        else if (!usnPattern.test(formData.usn.toUpperCase())) {
          errors.usn = 'Invalid USN format (e.g., 1AM22CS001)';
        }
      }
      if (role === 'staff' && !formData.employeeId) errors.employeeId = 'Employee ID is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        await login({ identifier: formData.identifier, password: formData.password });
        navigate('/');
      } else {
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role,
          ...(role === 'student' ? { usn: formData.usn } : { employeeId: formData.employeeId }),
        });
        setSuccess('Registration successful! You can now log in.');
        setIsLogin(true);
        setFormData({ name: '', email: '', usn: '', employeeId: '', password: '', identifier: '' });
        setFieldErrors({});
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-white transition-all duration-200 placeholder-gray-500 text-sm';

  const fieldErrorClass = 'text-red-400 text-xs mt-1 pl-1';

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0f] transition-colors duration-300 p-4">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-15%] left-[-5%] w-[45%] h-[45%] rounded-full bg-blue-500/20 blur-[100px] animate-blob" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[45%] h-[45%] rounded-full bg-purple-600/20 blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute top-[30%] right-[15%] w-[35%] h-[35%] rounded-full bg-orange-500/10 blur-[100px] animate-blob animation-delay-4000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[420px] p-6 sm:p-8 backdrop-blur-2xl glass-card rounded-3xl"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-violet-600 mb-1">
            Smart Helpdesk
          </h1>
          <p className="text-sm text-gray-400">
            {isLogin ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-black/30 rounded-xl mb-5">
          <button
            onClick={() => { setIsLogin(true); setError(''); setSuccess(''); setFieldErrors({}); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${isLogin
                ? 'bg-white/10 shadow-md text-primary'
                : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); setSuccess(''); setFieldErrors({}); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${!isLogin
                ? 'bg-white/10 shadow-md text-primary'
                : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            Register
          </button>
        </div>

        {/* Alerts */}
        {success && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 text-sm bg-green-900/20 text-green-400 rounded-xl text-center border border-green-700/30">
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 text-sm bg-red-900/20 text-red-400 rounded-xl text-center border border-red-700/30">
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="register-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 overflow-hidden"
              >
                {/* Role Toggle Buttons */}
                <div className="flex gap-3 mb-1">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all duration-300 ${role === 'student'
                        ? 'bg-primary/15 border-primary/40 text-primary shadow-sm'
                        : 'bg-transparent border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                  >
                    <GraduationCap size={18} />
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('staff')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all duration-300 ${role === 'staff'
                        ? 'bg-primary/15 border-primary/40 text-primary shadow-sm'
                        : 'bg-transparent border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                  >
                    <Briefcase size={18} />
                    Staff
                  </button>
                </div>

                {/* Name */}
                <div>
                  <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className={inputClass} />
                  {fieldErrors.name && <p className={fieldErrorClass}>{fieldErrors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className={inputClass} />
                  {fieldErrors.email && <p className={fieldErrorClass}>{fieldErrors.email}</p>}
                </div>

                {/* USN or Employee ID */}
                {role === 'student' ? (
                  <div>
                    <input type="text" name="usn" placeholder="USN (10 characters)" value={formData.usn} onChange={handleChange} maxLength={10} className={`${inputClass} uppercase`} />
                    {fieldErrors.usn && <p className={fieldErrorClass}>{fieldErrors.usn}</p>}
                  </div>
                ) : (
                  <div>
                    <input type="text" name="employeeId" placeholder="Employee ID" value={formData.employeeId} onChange={handleChange} className={inputClass} />
                    {fieldErrors.employeeId && <p className={fieldErrorClass}>{fieldErrors.employeeId}</p>}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Identifier */}
          {isLogin && (
            <div>
              <motion.input
                key="login-identifier"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                type="text"
                name="identifier"
                placeholder="USN / Employee ID / Email"
                value={formData.identifier}
                onChange={handleChange}
                className={inputClass}
              />
              {fieldErrors.identifier && <p className={fieldErrorClass}>{fieldErrors.identifier}</p>}
            </div>
          )}

          {/* Password */}
          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && <p className={fieldErrorClass}>{fieldErrors.password}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 px-4 flex justify-center items-center h-11 text-sm mt-6"
          >
            {loading ? <Spinner size="sm" /> : isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>

        {/* Footer hint */}
        <p className="text-center text-xs text-gray-500 mt-5">
          {isLogin ? (
            <>Don't have an account?{' '}<button onClick={() => { setIsLogin(false); setError(''); setFieldErrors({}); }} className="text-blue-500 hover:text-blue-600 font-medium">Register</button></>
          ) : (
            <>Already have an account?{' '}<button onClick={() => { setIsLogin(true); setError(''); setFieldErrors({}); }} className="text-blue-500 hover:text-blue-600 font-medium">Login</button></>
          )}
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
