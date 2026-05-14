import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../../store/useThemeStore';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const themeMode = useThemeStore((s) => s.mode);
  const isDark = themeMode === 'dark';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      <Result
        status="404"
        title={<span style={{ fontSize: 72, fontWeight: 600 }}>404</span>}
        subTitle="抱歉，您访问的页面不存在"
        extra={
          <Button type="primary" size="large" onClick={() => navigate('/', { replace: true })}>
            返回首页
          </Button>
        }
      />
    </div>
  );
}
