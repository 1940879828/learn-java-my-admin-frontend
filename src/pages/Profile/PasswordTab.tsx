import { ProForm, ProFormText } from '@ant-design/pro-components';
import { message } from 'antd';
import { changePassword } from '../../api/user';
import type { ChangePasswordRequest } from '../../types/user';

export default function PasswordTab() {
  const handleSubmit = async (values: ChangePasswordRequest) => {
    try {
      const res = await changePassword(values);
      if (res.data.code === 200) {
        message.success('密码修改成功，请重新登录');
        return true;
      }
      message.error(res.data.message);
      return false;
    } catch (error) {
      return false;
    }
  };

  return (
    <ProForm<ChangePasswordRequest>
      onFinish={handleSubmit}
      submitter={{
        searchConfig: { submitText: '确认修改' },
        resetButtonProps: false,
      }}
    >
      <ProFormText.Password
        name="oldPassword"
        label="当前密码"
        placeholder="请输入当前密码"
        rules={[{ required: true, message: '请输入当前密码' }]}
      />
      <ProFormText.Password
        name="newPassword"
        label="新密码"
        placeholder="请输入新密码"
        rules={[
          { required: true, message: '请输入新密码' },
          { min: 6, message: '密码至少6位' },
        ]}
      />
      <ProFormText.Password
        name="confirmPassword"
        label="确认密码"
        placeholder="请再次输入新密码"
        dependencies={['newPassword']}
        rules={[
          { required: true, message: '请确认新密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次输入的密码不一致'));
            },
          }),
        ]}
      />
    </ProForm>
  );
}
