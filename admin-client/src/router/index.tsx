// 注：路由表文件后缀必须为.tsx，否则组件会提示xx指的是一个值，但在此处用作类型
import { Navigate } from 'react-router-dom'

import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import System from '@/pages/System'
import User from '@/pages/System/User'

const routes = [
  // 访问/时重定向到/home
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <Home /> },
      {
        path: 'system',
        element: <System />,
        children: [
          { index: true, element: <Navigate to="/system/user" replace /> },
          { path: 'user', element: <User /> },
        ]
      }
    ]
  },
  {
    path:'*',
    element:<h1>404</h1>
  }
]
export default routes