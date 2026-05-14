import { useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useUserStore } from './store/useUserStore';
import { useThemeStore } from './store/useThemeStore';
import { createAppRouter } from './router';

export default function App() {
  const menuTree = useUserStore((s) => s.menuTree);
  const themeMode = useThemeStore((s) => s.mode);
  const router = useMemo(() => createAppRouter(menuTree), [menuTree]);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <RouterProvider router={router} key={menuTree.length} />
    </ConfigProvider>
  );
}
