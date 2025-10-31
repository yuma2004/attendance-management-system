import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import './Admin.css';

interface UserStatus {
  id: string;
  name: string;
  email: string;
  picture?: string | null;
  role: 'USER' | 'ADMIN';
  status: 'none' | 'checked_in' | 'on_break' | 'checked_out';
  latestEntry: {
    id: string;
    type: string;
    timestamp: string;
  } | null;
}

interface AuditLog {
  id: string;
  userId?: string;
  adminId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  admin?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function Admin() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');

  const { data: usersStatus, isLoading: usersLoading } = useQuery<UserStatus[]>({
    queryKey: ['admin', 'users', 'status', searchQuery],
    queryFn: async () => {
      const params = searchQuery ? { search: searchQuery } : {};
      const response = await apiClient.get('/admin/users/status', { params });
      return response.data;
    },
    refetchInterval: 30000, // 30秒ごとに更新
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery<AuditLog[]>({
    queryKey: ['admin', 'audit-logs'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/audit-logs?limit=50');
      return response.data;
    },
  });

  const getStatusText = (status: string) => {
    switch (status) {
      case 'none':
        return '未記録';
      case 'checked_in':
        return '出勤中';
      case 'on_break':
        return '休憩中';
      case 'checked_out':
        return '退勤済み';
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    return `status-badge status-${status}`;
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'CHECK_IN':
        return '出勤';
      case 'CHECK_OUT':
        return '退勤';
      case 'BREAK_START':
        return '休憩開始';
      case 'BREAK_END':
        return '休憩終了';
      case 'USER_ROLE_UPDATED':
        return 'ユーザー権限変更';
      default:
        return action;
    }
  };

  return (
    <div className="admin">
      <h2 className="admin-title">管理者画面</h2>

      <div className="admin-tabs">
        <button
          onClick={() => setActiveTab('users')}
          className={activeTab === 'users' ? 'active' : ''}
        >
          ユーザー一覧
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={activeTab === 'audit' ? 'active' : ''}
        >
          監査ログ
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="admin-content">
          <div className="search-box">
            <input
              type="text"
              placeholder="名前やメールアドレスで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {usersLoading ? (
            <div className="loading">読み込み中...</div>
          ) : usersStatus && usersStatus.length > 0 ? (
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>名前</th>
                    <th>メール</th>
                    <th>権限</th>
                    <th>ステータス</th>
                    <th>最終記録</th>
                  </tr>
                </thead>
                <tbody>
                  {usersStatus.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-info">
                          {user.picture && (
                            <img src={user.picture} alt={user.name} className="user-avatar-small" />
                          )}
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.role.toLowerCase()}`}>
                          {user.role === 'ADMIN' ? '管理者' : '一般'}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusClass(user.status)}>
                          {getStatusText(user.status)}
                        </span>
                      </td>
                      <td>
                        {user.latestEntry
                          ? `${new Date(user.latestEntry.timestamp).toLocaleString('ja-JP')}`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data">ユーザーが見つかりませんでした</div>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="admin-content">
          {auditLoading ? (
            <div className="loading">読み込み中...</div>
          ) : auditLogs && auditLogs.length > 0 ? (
            <div className="audit-logs">
              {auditLogs.map((log) => (
                <div key={log.id} className="audit-log-item">
                  <div className="audit-log-header">
                    <span className="audit-action">{getActionText(log.action)}</span>
                    <span className="audit-time">
                      {new Date(log.createdAt).toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <div className="audit-log-details">
                    {log.user && <div>ユーザー: {log.user.name} ({log.user.email})</div>}
                    {log.admin && <div>管理者: {log.admin.name} ({log.admin.email})</div>}
                    <div>リソース: {log.resourceType}</div>
                    {log.resourceId && <div>リソースID: {log.resourceId}</div>}
                    {log.ipAddress && <div>IPアドレス: {log.ipAddress}</div>}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="audit-details-json">
                        詳細: <pre>{JSON.stringify(log.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">監査ログがありません</div>
          )}
        </div>
      )}
    </div>
  );
}

