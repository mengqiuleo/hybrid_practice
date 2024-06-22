import { type GetProps, Form, Modal, Input, InputNumber, Upload, Button, message } from 'antd';
import { UploadOutlined} from '@ant-design/icons'
import type { GetProp, UploadFile, UploadProps } from 'antd';
import { useState } from 'react'

import './CreateForm.scss'

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

type FormComponentType = GetProps<typeof Form>;

interface DetailFormProps extends FormComponentType {
  createFormVisible: boolean;
  pushConfirmLoading: boolean;
  setCreateFormVisible: (visible: boolean) => void;
  setPushConfirmLoading: (visible: boolean) => void;
  handleAddPackage: (data: FormData) => void;
}

const FormItem = Form.Item

export const CreateForm: React.FC<DetailFormProps> = (props) => {
  const {
    createFormVisible,
    setCreateFormVisible,
    pushConfirmLoading,
    setPushConfirmLoading,
    handleAddPackage
  } = props

  const [ form ] = Form.useForm()

  let [uploadFile, setUploadFile] = useState<UploadFile[]>([]);

  // const handleInputFileChange = () => {
  //   const files = (document.querySelector('#fileUpload') as HTMLInputElement)
  //     .files;
  //   if (files && files.length > 0) {
  //     setUploadFile(files[0]);
  //   }
  // }

  const cancelHandle = () => {
    form.resetFields();

    // 重置 input file
    setUploadFile([]);
    // (document.querySelector('#fileUpload') as HTMLInputElement).value = '';

    setCreateFormVisible(false);
  }

  const upLoadProps = {
    onRemove: (file: any) => {
      const index = uploadFile.indexOf(file);
      const newFileList = uploadFile.slice();
      newFileList.splice(index, 1);
      setUploadFile(newFileList);
    },
    beforeUpload: (file: any) => {
      setUploadFile([file]);

      return false;
    },
    uploadFile,
  }

  const okHandle = () => {
    console.log('上传离线包-开始')
    form.validateFields()
      .then(async (fieldsValue) => {
        console.log(fieldsValue)
        
        // if (err) {
        //   console.log(err)
        //   return;
        // }
        // form.resetFields();
        // setPushConfirmLoading(true);

        const formData = new FormData();
        Object.keys(fieldsValue)
          .filter((key) => key !== 'file')
          .forEach((key) => {
            formData.append(key, fieldsValue[key]);
          });

        uploadFile.forEach((file) => {
          formData.append('file', file as FileType);
        });
        // formData.append('file', uploadFile);

        await handleAddPackage(formData);

        form.resetFields();
        // 重置 input file
        setUploadFile([]);
        // (document.querySelector('#fileUpload') as HTMLInputElement).value = '';
      })
  }

  return (
    <Modal
      title="新增离线包"
      okText="确认"
      cancelText="取消"
      closable={false}
      confirmLoading={pushConfirmLoading}
      open={createFormVisible}
      onCancel={cancelHandle}
      onOk={okHandle}
    >
      <Form form={form} onFinish={okHandle}>

        <FormItem 
          labelCol={{ span: 5 }} 
          wrapperCol={{ span: 15 }} 
          label="模块名"
          name="moduleName"
          rules={[{required: true, message: '请输入模块名'}]}
        >
          <Input maxLength={10} placeholder="建议用英文命名" />
        </FormItem>
        <FormItem 
          labelCol={{ span: 5 }} 
          wrapperCol={{ span: 15 }} 
          label="版本号"
          name="version"
          rules={[{ required: true, message: '请输入版本号' }]}
        >
          <InputNumber precision={0} min={0} />
        </FormItem>
        <FormItem 
          labelCol={{ span: 5 }} 
          wrapperCol={{ span: 15 }} 
          label="app名"
          name="appName"
          rules={[{ required: true, message: '请输入 APP 名' }]}
        >
          <Input maxLength={10} placeholder="建议用英文命名" />
        </FormItem>
        <FormItem
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 15 }}
          label="更新日志"
          name="updateLog"
          rules={[{ required: true, message: '请输入更新日志' }]}
        >
          <Input.TextArea maxLength={150} placeholder="最多不超过150字" />
        </FormItem>
        <FormItem 
          labelCol={{ span: 5 }} 
          wrapperCol={{ span: 15 }} 
          label="离线包"
          name="file"
          valuePropName=''
          rules={[{ required: true, message: '请上传离线包' }]}
        >
            {/* <div>
              <input
                type="file"
                id="fileUpload"
                className="input_file"
                onChange={handleInputFileChange}
              />
              <label htmlFor="fileUpload" className="label_file">
                上传离线包
              </label>
              <div>{uploadFile.name}</div>
            </div> */}
            <Upload {...upLoadProps}>
              <Button icon={<UploadOutlined />}>点击上传</Button>
            </Upload>
        </FormItem>
              
      </Form>
    </Modal>
  )
}