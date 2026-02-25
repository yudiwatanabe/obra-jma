'use client';

import { useState } from 'react';
import { supabase } from '../lib/db';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // login | signup | reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Cadastro realizado! Aguarde a aprovação do administrador para acessar o sistema.');
      setMode('login');
    }
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset',
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      setMode('login');
    }
    setLoading(false);
  };

  const S = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a365d 0%, #2d4a7a 100%)', padding: 20 },
    card: { background: '#fff', borderRadius: 16, padding: 36, width: '100%', maxWidth: 400, boxShadow: '0 16px 48px rgba(0,0,0,.15)' },
    title: { fontSize: 22, fontWeight: 700, color: '#1a365d', marginBottom: 4 },
    sub: { fontSize: 13, color: '#718096', marginBottom: 24 },
    label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 4 },
    input: { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 14 },
    btn: { width: '100%', padding: '11px 16px', background: '#1a365d', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    link: { background: 'none', border: 'none', color: '#3182ce', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 },
    err: { background: '#fed7d7', color: '#9b2c2c', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12 },
    msg: { background: '#c6f6d5', color: '#22543d', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12 },
  };

  const subtitle = mode === 'login' ? 'Acesse sua conta' : mode === 'signup' ? 'Criar nova conta' : 'Recuperar senha';

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏗️</div>
          <h1 style={S.title}>Obra JMA</h1>
          <p style={S.sub}>{subtitle}</p>
        </div>

        {error && <div style={S.err}>{error}</div>}
        {message && <div style={S.msg}>{message}</div>}

        {mode === 'reset' ? (
          <form onSubmit={handleReset}>
            <p style={{ fontSize: 13, color: '#718096', marginBottom: 14, lineHeight: 1.5 }}>
              Digite seu e-mail e enviaremos um link para redefinir sua senha.
            </p>
            <div>
              <label style={S.label}>E-mail</label>
              <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
            </div>
            <button type="submit" style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>
        ) : (
          <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
            {mode === 'signup' && (
              <div>
                <label style={S.label}>Nome</label>
                <input style={S.input} type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" required />
              </div>
            )}
            <div>
              <label style={S.label}>E-mail</label>
              <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
            </div>
            <div>
              <label style={S.label}>Senha</label>
              <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} />
            </div>
            {mode === 'login' && (
              <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 12 }}>
                <button type="button" style={{ ...S.link, fontSize: 12 }} onClick={() => { setMode('reset'); setError(''); setMessage(''); }}>Esqueci minha senha</button>
              </div>
            )}
            <button type="submit" style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          {mode === 'login' && (
            <span style={{ fontSize: 13, color: '#718096' }}>
              Não tem conta?{' '}
              <button style={S.link} onClick={() => { setMode('signup'); setError(''); setMessage(''); }}>Cadastrar</button>
            </span>
          )}
          {mode === 'signup' && (
            <span style={{ fontSize: 13, color: '#718096' }}>
              Já tem conta?{' '}
              <button style={S.link} onClick={() => { setMode('login'); setError(''); setMessage(''); }}>Entrar</button>
            </span>
          )}
          {mode === 'reset' && (
            <span style={{ fontSize: 13, color: '#718096' }}>
              Lembrou a senha?{' '}
              <button style={S.link} onClick={() => { setMode('login'); setError(''); setMessage(''); }}>Voltar ao login</button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
