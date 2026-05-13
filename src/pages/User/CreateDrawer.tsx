import { DrawerForm, ProFormText } from '@ant-design/pro-components';
import { message } from 'antd';
import { createUser } from '../../api/user';
import type { UserCreateRequest } from '../../types/user';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateDrawer({ open, onClose, onSuccess }: Props) {
  const handleSubmit = async (values: UserCreateRequest) => {
    try {
      const res = await createUser(values);
      if (res.data.code === 200 || res.data.code === 201) {
        message.success('创建成功');
        onSuccess();
        return true;
      }
      message.error(res.data.message);
      return false;
    } catch (error) {
      return false;
    }
  };

  return (
    <DrawerForm<UserCreateRequest>
      title="新建用户"
      open={open}
      onOpenChange={(visible) => !visible && onClose()}
      onFinish={handleSubmit}
    >
      <ProFormText
        name="username"
        label="用户名"
        placeholder="请输入用户名"
        rules={[{ required: true, message: '请输入用户名' }]}
      />
      <ProFormText.Password
        name="password"
        label="密码"
        placeholder="请输入密码"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6位' },
        ]}
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
        placeholder="请输入手机号"
      />
      <ProFormText
        name="remark"
        label="备注"
        placeholder="请输入备注"
      />
    </DrawerForm>
  );
}
