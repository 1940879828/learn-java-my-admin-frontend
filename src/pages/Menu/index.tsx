import { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getMenuTree, deleteMenu } from '../../api';
import type { MenuTreeNode } from '../../types/menu';
import Permission from '../../components/Permission';
import FormDrawer from './FormDrawer';

export default function MenuPage() {
  const actionRef = useRef<ActionType>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<MenuTreeNode | null>(null);

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteMenu(id);
      if (res.data.code === 200 || res.data.code === 204) {
        message.success('删除成功');
        actionRef.current?.reload();
        return;
      }
      message.error(res.data.message);
    } catch (error) {
      console.log(error)
    }
  };

  const columns: ProColumns<MenuTreeNode>[] = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '菜单名称', dataIndex: 'menuName', width: 200 },
    { title: '菜单编码', dataIndex: 'menuCode', width: 150 },
    {
      title: '类型',
      dataIndex: 'menuType',
      width: 80,
      render: (_, record) => {
        const typeMap = { DIR: '目录', MENU: '菜单', BUTTON: '按钮' };
        const colorMap = { DIR: 'blue', MENU: 'green', BUTTON: 'orange' };
        return (
          <Tag color={colorMap[record.menuType]}>
            {typeMap[record.menuType]}
          </Tag>
        );
      },
    },
    { title: '路径', dataIndex: 'path', width: 200 },
    { title: '权限码', dataIndex: 'perms', width: 150 },
    { title: '图标', dataIndex: 'icon', width: 100 },
    { title: '排序', dataIndex: 'sortOrder', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (_, record) =>
        record.status === 1 ? (
          <Tag color="success">启用</Tag>
        ) : (
          <Tag>禁用</Tag>
        ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      render: (_, record) => [
        <Permission key="edit" code="menu:edit">
          <a onClick={() => { setEditRecord(record); setFormOpen(true); }}>
            编辑
          </a>
        </Permission>,
        <Permission key="del" code="menu:delete">
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <a>删除</a>
          </Popconfirm>
        </Permission>,
      ],
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <ProTable<MenuTreeNode>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        search={false}
        scroll={{ x: 'max-content' }}
        request={async () => {
          try {
            const { data } = await getMenuTree();
            return {
              data: data.data,
              success: true,
            };
          } catch (error) {
            console.log(error)
            return { data: [], success: false };
          }
        }}
        toolbar={{
          actions: [
            <Permission key="add" code="menu:add">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => { setEditRecord(null); setFormOpen(true); }}
              >
                新建菜单
              </Button>
            </Permission>,
          ],
        }}
        pagination={false}
        expandable={{ defaultExpandAllRows: true }}
      />

      <FormDrawer
        open={formOpen}
        record={editRecord}
        onClose={() => { setFormOpen(false); setEditRecord(null); }}
        onSuccess={() => {
          setFormOpen(false);
          setEditRecord(null);
          actionRef.current?.reload();
        }}
      />
    </div>
  );
}
