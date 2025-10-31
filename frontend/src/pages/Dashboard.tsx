import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import './Dashboard.css';

interface TimeEntry {
  id: string;
  type: 'CHECK_IN' | 'CHECK_OUT' | 'BREAK_START' | 'BREAK_END';
  timestamp: string;
}

interface CurrentStatus {
  status: 'none' | 'checked_in' | 'on_break' | 'checked_out';
  latestEntry: TimeEntry | null;
}

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data: statusData, isLoading: statusLoading } = useQuery<CurrentStatus>({
    queryKey: ['timeEntries', 'current'],
    queryFn: async () => {
      const response = await apiClient.get('/time-entries/current-status');
      return response.data;
    },
    refetchInterval: 30000, // 30秒ごとに更新
  });

  const { data: entries, isLoading: entriesLoading } = useQuery<TimeEntry[]>({
    queryKey: ['timeEntries', 'history'],
    queryFn: async () => {
      const response = await apiClient.get('/time-entries?limit=20');
      return response.data;
    },
  });

  const createTimeEntry = useMutation({
    mutationFn: async (type: string) => {
      const response = await apiClient.post('/time-entries', { type });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    },
  });

  const handleAction = (type: string) => {
    if (confirm('この操作を実行しますか？')) {
      createTimeEntry.mutate(type);
    }
  };

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

  const getTypeText = (type: string) => {
    switch (type) {
      case 'CHECK_IN':
        return '出勤';
      case 'CHECK_OUT':
        return '退勤';
      case 'BREAK_START':
        return '休憩開始';
      case 'BREAK_END':
        return '休憩終了';
      default:
        return type;
    }
  };

  const status = statusData?.status || 'none';

  return (
    <div className="dashboard">
      <h2 className="dashboard-title">ダッシュボード</h2>

      <div className="status-card">
        <h3>現在のステータス</h3>
        {statusLoading ? (
          <div className="loading">読み込み中...</div>
        ) : (
          <div className="status-display">
            <span className={`status-badge status-${status}`}>
              {getStatusText(status)}
            </span>
            {statusData?.latestEntry && (
              <div className="latest-entry">
                最終記録: {getTypeText(statusData.latestEntry.type)} -{' '}
                {new Date(statusData.latestEntry.timestamp).toLocaleString('ja-JP')}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="actions-card">
        <h3>操作</h3>
        <div className="action-buttons">
          <button
            onClick={() => handleAction('CHECK_IN')}
            disabled={status !== 'none' || createTimeEntry.isPending}
            className="action-button action-checkin"
          >
            出勤
          </button>
          <button
            onClick={() => handleAction('BREAK_START')}
            disabled={status !== 'checked_in' || createTimeEntry.isPending}
            className="action-button action-break-start"
          >
            休憩開始
          </button>
          <button
            onClick={() => handleAction('BREAK_END')}
            disabled={status !== 'on_break' || createTimeEntry.isPending}
            className="action-button action-break-end"
          >
            休憩終了
          </button>
          <button
            onClick={() => handleAction('CHECK_OUT')}
            disabled={status === 'none' || status === 'checked_out' || createTimeEntry.isPending}
            className="action-button action-checkout"
          >
            退勤
          </button>
        </div>
      </div>

      <div className="history-card">
        <h3>記録履歴</h3>
        {entriesLoading ? (
          <div className="loading">読み込み中...</div>
        ) : entries && entries.length > 0 ? (
          <div className="history-list">
            {entries.map((entry) => (
              <div key={entry.id} className="history-item">
                <span className="history-type">{getTypeText(entry.type)}</span>
                <span className="history-time">
                  {new Date(entry.timestamp).toLocaleString('ja-JP')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-history">記録がありません</div>
        )}
      </div>
    </div>
  );
}

