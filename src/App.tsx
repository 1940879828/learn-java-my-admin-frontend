import { useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useUserStore } from './store/useUserStore';
import { createAppRouter } from './router';

export default function App() {
  const menuTree = useUserStore((s) => s.menuTree);
  const router = useMemo(() => createAppRouter(menuTree), [menuTree]);

  return (
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} key={menuTree.length} />
    </ConfigProvider>
  );
}
