import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LoginPageSimple() {
  const [maxId, setMaxId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { loginWithMaxId, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loginSuccess && isAuthenticated) {
      console.log('[LoginPage] Authentication successful, navigating to /today');
      const timer = setTimeout(() => {
        navigate('/today', { replace: true });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [loginSuccess, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginWithMaxId(maxId);
      setLoginSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Ошибка входа. Проверьте MAX ID.');
      setLoginSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        {/* Logo/Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '16px'
          }}>
            📚
          </div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 700, 
            color: '#667eea',
            marginBottom: '8px'
          }}>
            UniFlow
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: '#666',
            margin: 0
          }}>
            Войдите для доступа к сервисам
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">MAX ID</label>
            <input
              className="form-input"
              placeholder="Введите MAX ID"
              value={maxId}
              onChange={(e) => setMaxId(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              color: '#DC2626',
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        {/* Info text */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#F8F9FA',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0 }}>
            Используйте ваш MAX ID для входа в систему
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPageSimple;
