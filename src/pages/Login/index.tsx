import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Modal } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginFormPage, ProFormText, ProForm } from '@ant-design/pro-components';
import type { ProFormInstance } from '@ant-design/pro-components';
import { login, register } from '../../api/auth';
import { getCurrentUser } from '../../api/user';
import { useAuthStore } from '../../store/useAuthStore';
import { useUserStore } from '../../store/useUserStore';

interface LoginValues {
  username: string;
  password: string;
}

interface RegisterValues {
  username: string;
  password: string;
  email: string;
  phone?: string;
  confirmPassword: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setTokens } = useAuthStore();
  const { setUser } = useUserStore();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const registerFormRef = useRef<ProFormInstance<RegisterValues>>(undefined);

  const handleLogin = async (values: LoginValues) => {
    try {
      const res = await login(values);
      const { code, message: msg, data } = res.data;
      if (code === 200 && data) {
        setTokens(data.accessToken, data.refreshToken);

        // Immediately fetch user details
        const me = await getCurrentUser();
        if (me.data.code === 200 && me.data.data) {
          setUser(me.data.data);
        }

        message.success('登录成功');
        navigate('/', { replace: true });
        return true;
      } else {
        message.error(msg || '登录失败');
        return false;
      }
    } catch (error) {
      // Axios 拦截器已经显示了错误消息
      return false;
    }
  };

  const handleRegister = async (values: RegisterValues) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次密码输入不一致');
      return false;
    }
    setRegisterLoading(true);
    try {
      const res = await register({
        username: values.username,
        password: values.password,
        email: values.email,
        phone: values.phone
      });
      const { code, message: msg } = res.data;
      if (code === 200) {
        message.success('注册成功，请登录');
        setRegisterOpen(false);
        registerFormRef.current?.resetFields();
        return true;
      } else {
        message.error(msg || '注册失败');
        return false;
      }
    } catch {
      // Axios 拦截器已经显示了错误消息
      return false;
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <>
      <div style={{ height: '100vh', backgroundColor: '#f0f2f5' }}>
        <LoginFormPage<LoginValues>
          title="Antd Admin"
          subTitle="基于 Ant Design 的后台管理系统"
          onFinish={handleLogin}
          actions={
            <span
              style={{ cursor: 'pointer', color: '#1677ff' }}
              onClick={() => setRegisterOpen(true)}
            >
              注册账号
            </span>
          }
        >
          <ProFormText
            name="username"
            fieldProps={{ prefix: <UserOutlined /> }}
            placeholder="请输入用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          />
          <ProFormText.Password
            name="password"
            fieldProps={{ prefix: <LockOutlined /> }}
            placeholder="请输入密码"
            rules={[{ required: true, message: '请输入密码' }]}
          />
        </LoginFormPage>
      </div>

      <Modal
        title="注册账号"
        open={registerOpen}
        onCancel={() => setRegisterOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <ProForm<RegisterValues>
          formRef={registerFormRef}
          onFinish={handleRegister}
          submitter={{
            searchConfig: { submitText: '注册' },
            resetButtonProps: false,
            submitButtonProps: { loading: registerLoading, block: true },
          }}
        >
          <ProFormText
            name="username"
            label="用户名"
            placeholder="3-20位字母、数字或下划线"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, max: 20, message: '用户名长度为 3-20 位' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '只允许字母、数字和下划线' },
            ]}
          />
          <ProFormText.Password
            name="password"
            label="密码"
            placeholder="6-20位密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, max: 20, message: '密码长度为 6-20 位' },
            ]}
          />
          <ProFormText.Password
            name="confirmPassword"
            label="确认密码"
            placeholder="再次输入密码"
            rules={[{ required: true, message: '请再次输入密码' }]}
          />
          <ProFormText
            name="email"
            label="邮箱"
            placeholder="请输入邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          />
          <ProFormText
            name="phone"
            label="手机号"
            placeholder="请输入手机号（可选）"
          />
        </ProForm>
      </Modal>
    </>
  );
}
