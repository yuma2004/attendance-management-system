import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">出退勤管理システム</h1>
          <nav className="header-nav">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              ダッシュボード
            </Link>
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
                管理者画面
              </Link>
            )}
          </nav>
          <div className="header-user">
            {user?.picture && <img src={user.picture} alt={user.name} className="user-avatar" />}
            <span className="user-name">{user?.name}</span>
            <button onClick={logout} className="logout-button">
              ログアウト
            </button>
          </div>
        </div>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}

