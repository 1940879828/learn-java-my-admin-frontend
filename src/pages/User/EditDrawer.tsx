import { DrawerForm, ProFormText, ProFormRadio } from '@ant-design/pro-components';
import { message } from 'antd';
import { updateUser } from '../../api/user';
import type { UserResponse, UserUpdateRequest } from '../../types/user';

interface Props {
  record: UserResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditDrawer({ record, onClose, onSuccess }: Props) {
  const handleSubmit = async (values: UserUpdateRequest) => {
    if (!record) return false;

    try {
      const res = await updateUser(record.id, values);
      if (res.data.code === 200) {
        message.success('更新成功');
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
    <DrawerForm<UserUpdateRequest>
      title="编辑用户"
      open={!!record}
      onOpenChange={(visible) => !visible && onClose()}
      onFinish={handleSubmit}
      initialValues={record || undefined}
    >
      <ProFormText
        name="email"
        label="邮箱"
        placeholder="请输入邮箱"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' },
        ]}
      />
      <ProFormText name="phone" label="手机号" placeholder="请输入手机号" />
      <ProFormRadio.Group
        name="status"
        label="状态"
        options={[
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
        ]}
      />
      <ProFormText name="remark" label="备注" placeholder="请输入备注" />
    </DrawerForm>
  );
}
