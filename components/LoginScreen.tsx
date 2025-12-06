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
    // Глобальный фон - золотой градиент
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#EADBC8] via-[#DAC090] to-[#C4A464] relative overflow-hidden">
      
      {/* Декоративный блик в углу */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white opacity-20 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Карточка входа */}
      <div className="w-full max-w-[360px] bg-white rounded-[32px] p-8 shadow-2xl z-10 animate-fade-in-up">
        
        {/* Логотип */}
        <div className="flex flex-col items-center mb-10 mt-2">
          <div className="w-20 h-20 bg-gradient-to-b from-[#D4AF37] to-[#B8860B] rounded-2xl flex items-center justify-center text-white shadow-lg mb-4">
            <span className="text-5xl font-serif font-bold">F</span>
          </div>
          <h1 className="text-xl font-medium text-gray-900 tracking-wide">FOHOW Connect</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-4">
              EMAIL
            </label>
            <div className="relative group">
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full px-6 py-4 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] outline-none transition-all text-gray-700 placeholder-gray-400 shadow-inner"
                placeholder="Ваш Email"
              />
            </div>
          </div>
          
          <div>
             <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-4">
              ПАРОЛЬ
            </label>
            <div className="relative group">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] outline-none transition-all text-gray-700 placeholder-gray-400 shadow-inner"
                placeholder="•••••"
              />
              <div className="absolute inset-y-0 right-5 flex items-center text-gray-400">
                <Icons.Lock size={18} />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-xs bg-red-50 p-3 rounded-xl text-center border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#E3C670] to-[#C79D38] hover:to-[#B38B2E] text-white font-bold py-4 rounded-full shadow-[0_10px_20px_rgba(212,175,55,0.3)] transform active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 text-lg tracking-wide"
          >
            {loading ? 'Вход...' : 'Войти в систему'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a
            href="https://interactive.marketingfohow.ru"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 text-xs hover:text-[#D4AF37] transition-colors border-b border-transparent hover:border-[#D4AF37]"
          >
            Интерактивная доска
          </a>
        </div>
      </div>
      
      {/* Декор снизу */}
      <div className="absolute bottom-0 right-0 opacity-30">
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
            <path d="M100 0 L200 100 L100 200 L0 100 Z" fill="white" />
        </svg>
      </div>
    </div>
  );
};

export default LoginScreen;
