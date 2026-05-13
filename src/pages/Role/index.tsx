import { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { listRoles, deleteRole } from '../../api/role';
import type { RoleResponse } from '../../types/role';
import Permission from '../../components/Permission';
import FormDrawer from './FormDrawer';
import MenuAssignDrawer from './MenuAssignDrawer';

export default function RolePage() {
  const actionRef = useRef<ActionType>();
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<RoleResponse | null>(null);
  const [menuAssignRecord, setMenuAssignRecord] = useState<RoleResponse | null>(null);

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteRole(id);
      if (res.data.code === 200 || res.data.code === 204) {
        message.success('删除成功');
        actionRef.current?.reload();
        return;
      }
      message.error(res.data.message);
    } catch (error) {
      // Error handled by interceptor
    }
  };

  const columns: ProColumns<RoleResponse>[] = [
    { title: 'ID', dataIndex: 'id', width: 80, search: false },
    { title: '角色编码', dataIndex: 'roleCode', key: 'keyword' },
    { title: '角色名称', dataIndex: 'roleName', search: false },
    { title: '等级', dataIndex: 'level', search: false, width: 80 },
    { title: '数据权限', dataIndex: 'dataScope', search: false },
    { title: '创建人', dataIndex: 'createBy', search: false },
    { title: '创建时间', dataIndex: 'createTime', search: false, width: 180 },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      render: (_, record) => [
        <Permission key="edit" code="role:edit">
          <a onClick={() => { setEditRecord(record); setFormOpen(true); }}>
            编辑
          </a>
        </Permission>,
        <Permission key="menu" code="role:assign-menu">
          <a onClick={() => setMenuAssignRecord(record)}>分配菜单</a>
        </Permission>,
        <Permission key="del" code="role:delete">
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <a>删除</a>
          </Popconfirm>
        </Permission>,
      ],
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <ProTable<RoleResponse>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        request={async (params) => {
          try {
            const { data } = await listRoles({
              page: params.current,
              size: params.pageSize,
              keyword: params.keyword,
            });
            return {
              data: data.data.items,
              total: data.data.total,
              success: true,
            };
          } catch (error) {
            return { data: [], total: 0, success: false };
          }
        }}
        toolbar={{
          actions: [
            <Permission key="add" code="role:add">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => { setEditRecord(null); setFormOpen(true); }}
              >
                新建角色
              </Button>
            </Permission>,
          ],
        }}
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

      <MenuAssignDrawer
        record={menuAssignRecord}
        onClose={() => setMenuAssignRecord(null)}
        onSuccess={() => {
          setMenuAssignRecord(null);
          actionRef.current?.reload();
        }}
      />
    </div>
  );
}
