'use client';

export default function PendingApproval({ email, onSignOut }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7fafc', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 36, maxWidth: 420, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,.08)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a365d', marginBottom: 8 }}>Aguardando Aprovação</h2>
        <p style={{ fontSize: 14, color: '#718096', marginBottom: 20, lineHeight: 1.6 }}>
          Seu cadastro com <strong>{email}</strong> foi recebido. O administrador precisa aprovar seu acesso para que você possa utilizar o sistema.
        </p>
        <p style={{ fontSize: 13, color: '#a0aec0', marginBottom: 24 }}>
          Tente novamente mais tarde ou entre em contato com o administrador.
        </p>
        <button
          onClick={onSignOut}
          style={{ padding: '10px 24px', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Sair
        </button>
      </div>
    </div>
  );
}
