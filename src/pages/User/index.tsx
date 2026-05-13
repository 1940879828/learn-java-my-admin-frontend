import { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { listUsers, deleteUser, lockUser, unlockUser } from '../../api/user';
import type { UserResponse } from '../../types/user';
import Permission from '../../components/Permission';
import CreateDrawer from './CreateDrawer';
import EditDrawer from './EditDrawer';
import RoleAssignModal from './RoleAssignModal';

export default function UserPage() {
  const actionRef = useRef<ActionType>();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<UserResponse | null>(null);
  const [roleAssignRecord, setRoleAssignRecord] = useState<UserResponse | null>(null);

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteUser(id);
      if (res.data.code === 200) {
        message.success('删除成功');
        actionRef.current?.reload();
        return;
      }
      message.error(res.data.message);
    } catch (error) {
      // Error handled by interceptor
    }
  };

  const handleLock = async (id: number) => {
    try {
      const res = await lockUser(id);
      if (res.data.code === 200) {
        message.success('锁定成功');
        actionRef.current?.reload();
        return;
      }
      message.error(res.data.message);
    } catch (error) {
      // Error handled by interceptor
    }
  };

  const handleUnlock = async (id: number) => {
    try {
      const res = await unlockUser(id);
      if (res.data.code === 200) {
        message.success('解锁成功');
        actionRef.current?.reload();
        return;
      }
      message.error(res.data.message);
    } catch (error) {
      // Error handled by interceptor
    }
  };

  const columns: ProColumns<UserResponse>[] = [
    { title: 'ID', dataIndex: 'id', width: 80, search: false },
    { title: '用户名', dataIndex: 'username', key: 'keyword' },
    { title: '邮箱', dataIndex: 'email', search: false },
    { title: '手机号', dataIndex: 'phone', search: false },
    {
      title: '状态',
      dataIndex: 'status',
      valueEnum: {
        0: { text: '禁用', status: 'Default' },
        1: { text: '启用', status: 'Success' },
      },
    },
    {
      title: '锁定',
      dataIndex: 'locked',
      render: (_, record) =>
        record.locked ? <Tag color="red">已锁定</Tag> : <Tag>正常</Tag>,
      search: false,
    },
    { title: '创建时间', dataIndex: 'createTime', search: false, width: 180 },
    {
      title: '操作',
      valueType: 'option',
      width: 250,
      render: (_, record) => [
        <Permission key="edit" code="user:edit">
          <a onClick={() => setEditRecord(record)}>编辑</a>
        </Permission>,
        <Permission key="role" code="user:edit">
          <a onClick={() => setRoleAssignRecord(record)}>分配角色</a>
        </Permission>,
        <Permission key="lock" code="user:edit">
          <a
            onClick={() =>
              record.locked ? handleUnlock(record.id) : handleLock(record.id)
            }
          >
            {record.locked ? '解锁' : '锁定'}
          </a>
        </Permission>,
        <Permission key="del" code="user:delete">
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <a>删除</a>
          </Popconfirm>
        </Permission>,
      ],
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <ProTable<UserResponse>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        request={async (params) => {
          try {
            const { data } = await listUsers({
              page: params.current,
              size: params.pageSize,
              keyword: params.keyword,
              status: params.status,
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
            <Permission key="add" code="user:add">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateOpen(true)}
              >
                新建用户
              </Button>
            </Permission>,
          ],
        }}
      />

      <CreateDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          actionRef.current?.reload();
        }}
      />

      <EditDrawer
        record={editRecord}
        onClose={() => setEditRecord(null)}
        onSuccess={() => {
          setEditRecord(null);
          actionRef.current?.reload();
        }}
      />

      <RoleAssignModal
        record={roleAssignRecord}
        onClose={() => setRoleAssignRecord(null)}
        onSuccess={() => {
          setRoleAssignRecord(null);
          actionRef.current?.reload();
        }}
      />
    </div>
  );
}
