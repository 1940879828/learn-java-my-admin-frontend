import { useEffect, useState } from 'react';
import { Drawer, Tree, Button, Space, message } from 'antd';
import type { TreeProps } from 'antd';
import { getMenuTree } from '../../api/menu';
import { getRoleMenus, assignMenus } from '../../api/role';
import type { RoleResponse } from '../../types/role';
import type { MenuTreeNode } from '../../types/menu';

interface Props {
  record: RoleResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

function buildTreeData(nodes: MenuTreeNode[]): TreeProps['treeData'] {
  return nodes.map((node) => ({
    key: node.id,
    title: node.menuName,
    children: node.children?.length ? buildTreeData(node.children) : undefined,
  }));
}

export default function MenuAssignDrawer({ record, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<TreeProps['treeData']>([]);
  const [checkedKeys, setCheckedKeys] = useState<number[]>([]);

  useEffect(() => {
    if (!record) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [menuTreeRes, roleMenusRes] = await Promise.all([
          getMenuTree(),
          getRoleMenus(record.id),
        ]);

        if (menuTreeRes.data.code === 200) {
          setTreeData(buildTreeData(menuTreeRes.data.data));
        }

        if (roleMenusRes.data.code === 200) {
          setCheckedKeys(roleMenusRes.data.data.map((m) => m.id));
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
      const res = await assignMenus(record.id, { menuIds: checkedKeys });
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

  return (
    <Drawer
      title={`分配菜单 - ${record?.roleName}`}
      open={!!record}
      onClose={onClose}
      width={500}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            确定
          </Button>
        </Space>
      }
    >
      <Tree
        checkable
        treeData={treeData}
        checkedKeys={checkedKeys}
        onCheck={(keys) => setCheckedKeys(keys as number[])}
      />
    </Drawer>
  );
}
