import { useEffect, useState } from "react"
import { Button, Divider, Table } from "antd"

import './index.scss'
import { IPackageInfo, IPackageInfoListQuery } from "@/types/package"
import packageService from "@/services/package/requests"
import LocalConfig from '@/config.json'
import { IPagination } from "@/types/pagination"
import { CreateForm } from "@/components/CreateForm"

const Home = () => {
  const columns = [
    {
      title: '模块名',
      dataIndex: 'moduleName',
      key: 'moduleName'
    },
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version'
    },
    {
      title: 'app名',
      dataIndex: 'appName',
      key: 'appName'
    },
    {
      title: '状态',
      dataIndex: 'statusStr',
      key: 'statusStr'
    },
    {
      title: '发布时间',
      dataIndex: 'createTime',
      key: 'createTime'
    },
    {
      title: '操作',
      key: 'action',
      render: (text: string, record: IPackageInfo) => (
        <>
          <Button
            className="tableListButton"
            // onClick={() => handleModalVisible(true, record)}
          >
            查看
          </Button>
          <Divider type="vertical" />
          <Button
            className="tableListButton"
            // onClick={() => handleConfirmDeletePackage(record.id)}
          >
            删除
          </Button>
        </>
      )
    }
  ]
  
  const [listTotal, setListTotal] = useState(0)
  const [packageList, setPackageList] = useState([] as IPackageInfo[])
  const [formValues, setFormValues] = useState({})
  const [createFormVisible, setCreateFormVisible] = useState(false)
  const [pushConfirmLoading, setPushConfirmLoading] = useState(false)

  const handleAddPackage = async (data: FormData) => {
    try {
      await packageService.pushPackageInfo(data);
    } catch (error) {
      console.log(error);
    } finally {
      setCreateFormVisible(false);
      setPushConfirmLoading(false);
      setTimeout(() => {
        fetchPackageList({ page: 1, size: LocalConfig.ListQueryCount });
      }, 2000);
    }
  }

  const handleTableChange = (pagination: IPagination) => {
    fetchPackageList({
      page: pagination.current!,
      size: pagination.pageSize!,
      ...formValues
    });
  }

  const fetchPackageList = async (query: IPackageInfoListQuery) => {
    if (query.moduleName === '') {
      Reflect.deleteProperty(query, 'moduleName');
    }

    if (query.appName === '') {
      Reflect.deleteProperty(query, 'appName');
    }

    if (query.status === 'all') {
      Reflect.deleteProperty(query, 'status');
    }

    const { list, total } = await packageService.getPackageInfoList(query);
    setPackageList(list);
    setListTotal(total);
  }

  useEffect(() => {
    fetchPackageList({ page: 1, size: LocalConfig.ListQueryCount });
  }, [])
  
  return (
    <>
      <div className="tableList">
        <div className="tableListOperator">
          <Button type="primary" onClick={() => setCreateFormVisible(true)} >
            新增离线包
          </Button>
        </div>
        <Table 
          bordered
          pagination={{
            pageSize: LocalConfig.ListQueryCount,
            total: listTotal
          }}
          columns={columns}
          dataSource={packageList}
          onChange={handleTableChange}
        />
      </div>
      <CreateForm 
        createFormVisible={createFormVisible}
        setCreateFormVisible={setCreateFormVisible}
        pushConfirmLoading={pushConfirmLoading}
        setPushConfirmLoading={setPushConfirmLoading}
        handleAddPackage={handleAddPackage}
      />
    </>

  )
}

export default Home