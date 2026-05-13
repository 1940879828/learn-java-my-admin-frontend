import { useEffect, useState } from 'react';
import { Modal, Transfer, message } from 'antd';
import type { TransferProps } from 'antd';
import { listRoles } from '../../api/role';
import { getUserRoles, assignRoles } from '../../api/user';
import type { UserResponse } from '../../types/user';
import type { RoleResponse } from '../../types/role';

interface Props {
  record: UserResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RoleAssignModal({ record, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [allRoles, setAllRoles] = useState<RoleResponse[]>([]);
  const [targetKeys, setTargetKeys] = useState<number[]>([]);

  useEffect(() => {
    if (!record) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [rolesRes, userRolesRes] = await Promise.all([
          listRoles({ page: 1, size: 1000 }),
          getUserRoles(record.id),
        ]);

        if (rolesRes.data.code === 200) {
          setAllRoles(rolesRes.data.data.items);
        }

        if (userRolesRes.data.code === 200) {
          setTargetKeys(userRolesRes.data.data.map((r) => r.id));
        }
      } catch (error) {
        // Error handled by interceptor
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [record]);

  const handleSubmit = async () => {
    if (!record) return;

    setLoading(true);
    try {
      const res = await assignRoles(record.id, { roleIds: targetKeys });
      if (res.data.code === 200) {
        message.success('分配成功');
        onSuccess();
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const onChange: TransferProps['onChange'] = (newTargetKeys) => {
    setTargetKeys(newTargetKeys as number[]);
  };

  return (
    <Modal
      title={`分配角色 - ${record?.username}`}
      open={!!record}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      width={600}
    >
      <Transfer
        dataSource={allRoles.map((r) => ({ key: r.id, title: r.roleName }))}
        targetKeys={targetKeys}
        onChange={onChange}
        render={(item) => item.title}
        listStyle={{ width: 250, height: 400 }}
      />
    </Modal>
  );
}
