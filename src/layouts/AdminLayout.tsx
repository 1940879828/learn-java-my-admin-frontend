import { useMemo } from 'react';
import { ProLayout } from '@ant-design/pro-components';
import type { MenuDataItem } from '@ant-design/pro-components';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Dropdown, Switch } from 'antd';
import type { MenuProps } from 'antd';
import { LogoutOutlined, UserOutlined, BulbOutlined } from '@ant-design/icons';
import { useUserStore } from '../store/useUserStore';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { getIcon } from '../utils/iconMap';
import type { MenuTreeNode } from '../types/menu';

function toMenuDataItems(nodes: MenuTreeNode[]): MenuDataItem[] {
  return nodes
    .filter((n) => n.menuType !== 'BUTTON' && n.visible)
    .map((n) => ({
      path: n.path,
      name: n.menuName,
      icon: getIcon(n.icon),
      children: n.children?.length ? toMenuDataItems(n.children) : undefined,
    }));
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const menuTree = useUserStore((s) => s.menuTree);
  const user = useUserStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clear);
  const resetUser = useUserStore((s) => s.reset);
  const themeMode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggleMode);

  const route = useMemo(
    () => ({ path: '/', routes: toMenuDataItems(menuTree) }),
    [menuTree]
  );

  const handleLogout = () => {
    clearAuth();
    resetUser();
    navigate('/login', { replace: true });
  };

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'theme',
      icon: <BulbOutlined />,
      label: (
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          onClick={(e) => e.stopPropagation()}
        >
          <span>暗黑模式</span>
          <Switch
            checked={themeMode === 'dark'}
            onChange={toggleTheme}
            size="small"
            style={{ marginLeft: 8 }}
          />
        </div>
      ),
    },
    {
      type: 'divider',
    },
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
      route={route}
      location={location}
      layout="mix"
      menuItemRender={(item, dom) => <Link to={item.path ?? '/'}>{dom}</Link>}
      avatarProps={{
        src: undefined,
        title: user?.username,
        render: (_, dom) => (
          <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
            {dom}
          </Dropdown>
        ),
      }}
    >
      <Outlet />
    </ProLayout>
  );
}
