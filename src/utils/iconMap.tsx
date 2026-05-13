import {
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  MenuOutlined,
  SettingOutlined,
  AppstoreOutlined,
  DashboardOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

const iconMap: Record<string, ReactNode> = {
  HomeOutlined: <HomeOutlined />,
  UserOutlined: <UserOutlined />,
  TeamOutlined: <TeamOutlined />,
  MenuOutlined: <MenuOutlined />,
  SettingOutlined: <SettingOutlined />,
  AppstoreOutlined: <AppstoreOutlined />,
  DashboardOutlined: <DashboardOutlined />,
  ProfileOutlined: <ProfileOutlined />,
};

export const getIcon = (name?: string): ReactNode => {
  if (!name) return undefined;
  return iconMap[name];
};
