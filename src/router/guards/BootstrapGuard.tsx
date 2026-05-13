import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { useUserStore } from '../../store/useUserStore';
import { getCurrentUser } from '../../api/user';
import { useAuthStore } from '../../store/useAuthStore';

export default function BootstrapGuard() {
  const { loaded, setUser } = useUserStore();

  useEffect(() => {
    if (loaded) return;

    getCurrentUser()
      .then((res) => {
        if (res.data.code === 200 && res.data.data) {
          setUser(res.data.data);
        } else {
          useAuthStore.getState().clear();
        }
      })
      .catch(() => {
        useAuthStore.getState().clear();
      });
  }, [loaded, setUser]);

  if (!loaded) {
    return <Spin spinning fullscreen tip="加载中..." />;
  }

  return <Outlet />;
}
