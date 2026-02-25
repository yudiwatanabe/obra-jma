'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/db';

export default function ResetPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('As senhas não coincidem.'); return; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Senha atualizada com sucesso!');
      setTimeout(() => { window.location.href = '/'; }, 2000);
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
    err: { background: '#fed7d7', color: '#9b2c2c', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12 },
    msg: { background: '#c6f6d5', color: '#22543d', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12 },
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔑</div>
          <h1 style={S.title}>Nova Senha</h1>
          <p style={S.sub}>Defina sua nova senha</p>
        </div>

        {error && <div style={S.err}>{error}</div>}
        {message && <div style={S.msg}>{message}</div>}

        {!message && (
          <form onSubmit={handleUpdate}>
            <div>
              <label style={S.label}>Nova senha</label>
              <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} />
            </div>
            <div>
              <label style={S.label}>Confirmar senha</label>
              <input style={S.input} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repita a senha" required minLength={6} />
            </div>
            <button type="submit" style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'Atualizando...' : 'Atualizar senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
