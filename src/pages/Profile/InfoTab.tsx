import { Descriptions } from 'antd';
import { useUserStore } from '../../store/useUserStore';

export default function InfoTab() {
  const user = useUserStore((s) => s.user);

  return (
    <Descriptions column={1} bordered>
      <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
      <Descriptions.Item label="邮箱">{user?.email}</Descriptions.Item>
      <Descriptions.Item label="手机号">{user?.phone || '-'}</Descriptions.Item>
      <Descriptions.Item label="状态">
        {user?.status === 1 ? '启用' : '禁用'}
      </Descriptions.Item>
      <Descriptions.Item label="角色">
        {user?.roles.map((r) => r.roleName).join('、') || '无'}
      </Descriptions.Item>
      <Descriptions.Item label="创建时间">{user?.createTime}</Descriptions.Item>
    </Descriptions>
  );
}
