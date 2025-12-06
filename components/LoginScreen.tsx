import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { Icons } from '../constants';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await api.login(loginId.trim(), password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-gold relative overflow-hidden">
      {/* Star decoration */}
      <div className="star-decoration"></div>

      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4">
            <span className="text-4xl font-bold" style={{ fontFamily: 'serif' }}>F</span>
          </div>
          <h1 className="text-xl font-medium text-gray-800">FOHOW Connect</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <input
              type="text"
              required
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full px-4 py-4 rounded-full border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-gray-600"
              placeholder="EMAIL"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 pr-12 rounded-full border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-gray-600"
              placeholder="ПАРОЛЬ"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400"
            >
              <Icons.Lock />
            </button>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg text-center border border-red-100 whitespace-pre-wrap">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gold-gradient text-white font-bold py-4 rounded-full transform active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed text-base"
          >
            {loading ? 'Проверка данных...' : 'Воити в систем'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="https://interactive.marketingfohow.ru"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 text-sm underline"
          >
            Интеракивания доска
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
