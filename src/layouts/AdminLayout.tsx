import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { Dropdown, Modal, message } from 'antd';
import { LogoutOutlined, HomeOutlined, UserOutlined } from '@ant-design/icons';
import { ProLayout } from '@ant-design/pro-components';
import type { MenuDataItem } from '@ant-design/pro-components';
import { useAuthStore } from '../store/useAuthStore';
import { logout } from '../api/auth';

const menuRoute = {
  path: '/',
  routes: [
    {
      path: '/',
      name: '首页',
      icon: <HomeOutlined />,
    },
  ] as MenuDataItem[],
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { username, clearAuth } = useAuthStore();

  const handleLogout = () => {
    Modal.confirm({
      title: '退出登录',
      content: '确定要退出登录吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await logout();
        } catch {
          // 无论 API 是否成功，都执行本地清理
        }
        clearAuth();
        message.success('已退出登录');
        navigate('/login', { replace: true });
      },
    });
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <ProLayout
      title="Antd Admin"
      route={menuRoute}
      location={location}
      layout="mix"
      menuItemRender={(item: MenuDataItem, dom: React.ReactNode) => (
        <Link to={item.path ?? '/'}>{dom}</Link>
      )}
      avatarProps={{
        icon: <UserOutlined />,
        title: username ?? '用户',
        size: 'small',
        render: (_props, dom) => (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            {dom as React.ReactElement}
          </Dropdown>
        ),
      }}
      contentStyle={{ minHeight: 'calc(100vh - 56px)' }}
    >
      <Outlet />
    </ProLayout>
  );
}
