import { useEffect, useState } from 'react';
import {
  DrawerForm,
  ProFormText,
  ProFormSelect,
  ProFormDigit,
  ProFormRadio,
  ProFormTreeSelect,
} from '@ant-design/pro-components';
import { message } from 'antd';
import { createMenu, updateMenu, getMenuTree } from '../../api/menu';
import type { MenuTreeNode, MenuCreateRequest, MenuUpdateRequest } from '../../types/menu';
import { MenuType } from '../../types/enums';

interface Props {
  open: boolean;
  record: MenuTreeNode | null;
  onClose: () => void;
  onSuccess: () => void;
}

function buildTreeSelectData(nodes: MenuTreeNode[], excludeId?: number): any[] {
  return nodes
    .filter((node) => node.id !== excludeId)
    .map((node) => ({
      value: node.id,
      title: node.menuName,
      children: node.children?.length
        ? buildTreeSelectData(node.children, excludeId)
        : undefined,
    }));
}

export default function FormDrawer({ open, record, onClose, onSuccess }: Props) {
  const [menuTree, setMenuTree] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      getMenuTree().then((res) => {
        if (res.data.code === 200) {
          setMenuTree(buildTreeSelectData(res.data.data, record?.id));
        }
      });
    }
  }, [open, record]);

  const handleSubmit = async (values: MenuCreateRequest | MenuUpdateRequest) => {
    try {
      const res = record
        ? await updateMenu(record.id, values)
        : await createMenu(values as MenuCreateRequest);

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
      title={record ? '编辑菜单' : '新建菜单'}
      open={open}
      onOpenChange={(visible) => !visible && onClose()}
      onFinish={handleSubmit}
      initialValues={
        record || { menuType: MenuType.MENU, visible: true, status: 1, sortOrder: 1 }
      }
    >
      <ProFormTreeSelect
        name="parentId"
        label="上级菜单"
        placeholder="不选则为顶级菜单"
        allowClear
        fieldProps={{ treeData: menuTree, showSearch: true, treeNodeFilterProp: 'title' }}
      />
      <ProFormText
        name="menuName"
        label="菜单名称"
        placeholder="请输入菜单名称"
        rules={[{ required: true, message: '请输入菜单名称' }]}
      />
      {!record && (
        <ProFormText
          name="menuCode"
          label="菜单编码"
          placeholder="请输入菜单编码"
          rules={[{ required: true, message: '请输入菜单编码' }]}
        />
      )}
      <ProFormSelect
        name="menuType"
        label="菜单类型"
        options={[
          { label: '目录', value: MenuType.DIR },
          { label: '菜单', value: MenuType.MENU },
          { label: '按钮', value: MenuType.BUTTON },
        ]}
        rules={[{ required: true, message: '请选择菜单类型' }]}
      />
      <ProFormText name="path" label="路由路径" placeholder="请输入路由路径" />
      <ProFormText name="component" label="组件路径" placeholder="如: User/List" />
      <ProFormText name="perms" label="权限码" placeholder="如: user:list" />
      <ProFormText name="icon" label="图标" placeholder="如: UserOutlined" />
      <ProFormDigit name="sortOrder" label="排序" min={0} />
      <ProFormRadio.Group
        name="visible"
        label="是否可见"
        options={[
          { label: '是', value: true },
          { label: '否', value: false },
        ]}
      />
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
