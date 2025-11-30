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
  
  // Simple validation to show user hint
  const isFohowLike = /^[A-Za-z]{3}\d+/.test(loginId);

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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-emerald-800 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
      
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl z-10 animate-fade-in-up border-b-4 border-emerald-900">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 transform -rotate-3 border-4 border-emerald-500">
            <span className="text-4xl font-bold">F</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FOHOW Connect</h1>
          <p className="text-gray-500 text-sm mt-1">Единая система входа</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 ml-1">
              Компьютерный номер / Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Icons.Card />
              </div>
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium"
                placeholder="Напр. RUY68241101111"
              />
            </div>
            {isFohowLike && (
               <div className="mt-1 ml-1 text-xs text-emerald-600 flex items-center gap-1">
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                 Формат ID распознан
               </div>
            )}
          </div>
          
          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 ml-1">
              Пароль
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Icons.Lock />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg text-center border border-red-100 whitespace-pre-wrap">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 transform active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2 text-lg"
          >
            {loading ? 'Проверка данных...' : 'Войти в систему'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 mb-2">
            Нет номера FOHOW?
          </p>
          <button 
            type="button"
            className="text-emerald-600 text-sm font-semibold hover:underline"
            onClick={() => alert("Переход на страницу регистрации в Интерактивной Доске")}
          >
            Зарегистрироваться как Клиент
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-emerald-200/50 text-[10px] text-center max-w-xs leading-tight">
        Вход осуществляется с использованием данных интерактивной доски. 
        Верификация ID происходит через центральный сервер.
      </div>
    </div>
  );
};

export default LoginScreen;