import { Link, Outlet } from 'react-router-dom'

const System = () => {
  return (
    <div>
      {/* <div>
        System的导航
        <Link to="/system/user" style={{ marginRight: 20 }}>
          用户管理
        </Link>
      </div> */}
      System的内容区域: 
      <Outlet></Outlet>
    </div>
  )
}

export default System
