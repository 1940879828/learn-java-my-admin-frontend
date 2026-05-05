import { Card, Typography, Space, Row, Col, Statistic, Timeline, Tag } from 'antd';
import {
  SmileOutlined,
  RocketOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';

const { Title, Paragraph, Text } = Typography;

export default function HomePage() {
  const username = useAuthStore((s) => s.username);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space align="center" size="middle">
            <SmileOutlined style={{ fontSize: 48, color: '#1677ff' }} />
            <div>
              <Title level={2} style={{ margin: 0 }}>
                欢迎回来，{username ?? '用户'}！
              </Title>
              <Text type="secondary">祝你开心每一天</Text>
            </div>
          </Space>

          <Paragraph>
            你已成功登录 <Text strong>Antd Admin</Text> 后台管理系统。
            本系统基于 React 19、Ant Design 6、TypeScript 和 Vite 8 构建，
            采用 JWT 双 Token 认证机制，为你提供安全、高效的管理体验。
          </Paragraph>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="在线时长"
              value={0}
              suffix="小时"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待办任务"
              value={0}
              suffix="项"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="系统消息"
              value={0}
              suffix="条"
              prefix={<RocketOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="安全评分"
              value={98}
              suffix="分"
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="系统特性" bordered={false}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Tag color="blue">JWT 双 Token</Tag>
                <Text>Access Token + Refresh Token 自动续期机制</Text>
              </div>
              <div>
                <Tag color="green">路由守卫</Tag>
                <Text>未登录自动跳转，保护私有页面</Text>
              </div>
              <div>
                <Tag color="orange">请求拦截</Tag>
                <Text>自动注入认证信息，统一错误处理</Text>
              </div>
              <div>
                <Tag color="purple">状态管理</Tag>
                <Text>Zustand 轻量级状态管理，与 localStorage 同步</Text>
              </div>
              <div>
                <Tag color="cyan">响应式设计</Tag>
                <Text>完美适配桌面端和移动端</Text>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="最近动态" bordered={false}>
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <>
                      <Text type="secondary">刚刚</Text>
                      <br />
                      <Text>成功登录系统</Text>
                    </>
                  ),
                },
                {
                  color: 'blue',
                  children: (
                    <>
                      <Text type="secondary">2 分钟前</Text>
                      <br />
                      <Text>系统初始化完成</Text>
                    </>
                  ),
                },
                {
                  color: 'gray',
                  children: (
                    <>
                      <Text type="secondary">5 分钟前</Text>
                      <br />
                      <Text>依赖安装完成</Text>
                    </>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title="快速开始" bordered={false}>
        <Paragraph>
          <ul>
            <li>
              <Text strong>添加新页面：</Text> 在 <Text code>src/pages</Text> 目录下创建新组件
            </li>
            <li>
              <Text strong>配置路由：</Text> 在 <Text code>src/router/index.tsx</Text>{' '}
              中添加路由配置
            </li>
            <li>
              <Text strong>添加菜单：</Text> 在 <Text code>src/layouts/AdminLayout.tsx</Text>{' '}
              的 menuRoute 中配置
            </li>
            <li>
              <Text strong>添加 API：</Text> 在 <Text code>src/api</Text> 目录下封装接口
            </li>
          </ul>
        </Paragraph>
      </Card>
    </Space>
  );
}
