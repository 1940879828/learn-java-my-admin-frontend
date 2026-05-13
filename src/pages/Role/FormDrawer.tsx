import { DrawerForm, ProFormText, ProFormDigit, ProFormSelect } from '@ant-design/pro-components';
import { message } from 'antd';
import { createRole, updateRole } from '../../api/role';
import type { RoleResponse, RoleCreateRequest, RoleUpdateRequest } from '../../types/role';
import { DataScope } from '../../types/enums';

interface Props {
  open: boolean;
  record: RoleResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FormDrawer({ open, record, onClose, onSuccess }: Props) {
  const handleSubmit = async (values: RoleCreateRequest | RoleUpdateRequest) => {
    try {
      const res = record
        ? await updateRole(record.id, values)
        : await createRole(values as RoleCreateRequest);

      if (res.data.code === 200 || res.data.code === 201) {
        message.success(record ? '更新成功' : '创建成功');
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
    <DrawerForm
      title={record ? '编辑角色' : '新建角色'}
      open={open}
      onOpenChange={(visible) => !visible && onClose()}
      onFinish={handleSubmit}
      initialValues={record || { dataScope: DataScope.ALL }}
    >
      {!record && (
        <ProFormText
          name="roleCode"
          label="角色编码"
          placeholder="请输入角色编码"
          rules={[{ required: true, message: '请输入角色编码' }]}
        />
      )}
      <ProFormText
        name="roleName"
        label="角色名称"
        placeholder="请输入角色名称"
        rules={[{ required: true, message: '请输入角色名称' }]}
      />
      <ProFormDigit
        name="level"
        label="等级"
        placeholder="请输入等级"
        min={1}
        max={99}
      />
      <ProFormSelect
        name="dataScope"
        label="数据权限"
        options={[
          { label: '全部数据', value: DataScope.ALL },
          { label: '自定义', value: DataScope.CUSTOM },
          { label: '本部门', value: DataScope.DEPT },
          { label: '本部门及子部门', value: DataScope.DEPT_AND_CHILD },
          { label: '仅本人', value: DataScope.SELF },
        ]}
        rules={[{ required: true, message: '请选择数据权限' }]}
      />
      <ProFormText
        name="remark"
        label="备注"
        placeholder="请输入备注"
      />
    </DrawerForm>
  );
}
