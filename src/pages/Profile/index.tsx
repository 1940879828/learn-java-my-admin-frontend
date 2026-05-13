import { Card, Tabs } from 'antd';
import InfoTab from './InfoTab';
import PasswordTab from './PasswordTab';

export default function ProfilePage() {
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Tabs
          items={[
            { key: 'info', label: '基本信息', children: <InfoTab /> },
            { key: 'password', label: '修改密码', children: <PasswordTab /> },
          ]}
        />
      </Card>
    </div>
  );
}
