import { useNavigate } from 'react-router-dom';
import { message, Space, Typography } from 'antd';
import { LockOutlined, UserOutlined, SafetyOutlined } from '@ant-design/icons';
import { LoginFormPage, ProFormText } from '@ant-design/pro-components';
import { login } from '../../api';
import { getCurrentUser } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';
import { useUserStore } from '../../store/useUserStore';
import { useThemeStore } from '../../store/useThemeStore';
import styles from './index.module.css';

const { Text } = Typography;

interface LoginValues {
  username: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setTokens } = useAuthStore();
  const { setUser } = useUserStore();
  const themeMode = useThemeStore((s) => s.mode);
  const isDark = themeMode === 'dark';

  const handleLogin = async (values: LoginValues) => {
    try {
      const res = await login(values);
      const { code, message: msg, data } = res.data;
      if (code === 200 && data) {
        setTokens(data.accessToken, data.refreshToken);

        try {
          const me = await getCurrentUser();
          if (me.data.code === 200 && me.data.data) {
            setUser(me.data.data);
          }
        } catch (userError) {
          console.error('Failed to fetch user details:', userError);
        }

        message.success('登录成功');
        navigate('/', { replace: true });
        return true;
      } else {
        message.error(msg || '登录失败');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        background: isDark
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
      }}
    >
      <LoginFormPage<LoginValues>
        backgroundImageUrl={
          isDark
            ? undefined
            : 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr'
        }
        logo={<SafetyOutlined style={{ fontSize: 48, color: '#1677ff' }} />}
        title="JWT Admin"
        subTitle={
          <Space orientation="vertical" size={4}>
            <Text type="secondary">基于 Spring Boot + JWT 的权限管理系统</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Java 8 · Spring Boot 2.7 · MySQL 5.7
            </Text>
          </Space>
        }
        containerStyle={{
          backgroundColor: isDark ? 'rgba(20, 20, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          borderRadius: 8,
        }}
        className={styles.loginContainer}
        onFinish={handleLogin}
        submitter={{
          searchConfig: {
            submitText: '登录',
          },
          submitButtonProps: {
            size: 'large',
            style: {
              width: '100%',
            },
          },
        }}
      >
        <ProFormText
          name="username"
          fieldProps={{
            size: 'large',
            prefix: <UserOutlined style={{ color: '#1677ff' }} />,
          }}
          placeholder="用户名: admin"
          initialValue="admin"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, max: 20, message: '用户名长度为 3-20 位' },
          ]}
        />
        <ProFormText.Password
          name="password"
          fieldProps={{
            size: 'large',
            prefix: <LockOutlined style={{ color: '#1677ff' }} />,
          }}
          placeholder="密码: 123456"
          initialValue="123456"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码长度至少 6 位' },
          ]}
        />
      </LoginFormPage>
    </div>
  );
}
