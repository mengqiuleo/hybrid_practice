import  { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  DashboardFilled,
  DiffOutlined,
  HomeOutlined,
  EditOutlined
} from '@ant-design/icons'
import { Layout, Menu, Button } from 'antd'
import type { MenuProps } from 'antd'

import './Layout.scss'

const { Header, Sider, Content } = Layout

const LayoutApp = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()


  const items = [
    { label: '离线包列表', key: '/', icon: <HomeOutlined /> },
    { label: '全局配置', key: '/system/user', icon: <DiffOutlined /> },
    { label: 'other', key: '3', icon: <EditOutlined />, disabled: true }
  ]

  const onClick: MenuProps['onClick'] = ({ item, key, keyPath, domEvent }) => {
    // console.log('click ', e);
    navigate(keyPath[0]);
  };

  return (
    <Layout className="layout">
      <Sider trigger={null} collapsible collapsed={collapsed} >
        <div className="layout-logo-vertical" style={{ color: '#fff' }}>
          <span className="layout-logo">
            {' '}
            <DashboardFilled />
          </span>
          {!collapsed && <span>react-antd5-admin</span>}
        </div>
        <Menu 
          mode="inline" 
          theme="dark"
          defaultSelectedKeys={[ pathname ]}
          selectedKeys={[ pathname ]}
          items={items}
          onClick={onClick}
        >
          {/* <Menu.Item icon={<HomeOutlined />} key="/">
            <Link to="/">离线包列表</Link>
          </Menu.Item>
          <Menu.Item icon={<DiffOutlined />} key="/system/user">
            <Link to="/system/user">全局配置</Link>
          </Menu.Item>
          <Menu.Item icon={<EditOutlined />} key="3">
            other
          </Menu.Item> */}
        </Menu>
      </Sider>

      <Layout>
        <Header
          style={{ padding: 0 }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
              color: '#fff'
            }}
          />
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280
          }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default LayoutApp
