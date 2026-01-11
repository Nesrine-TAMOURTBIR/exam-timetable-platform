import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Card, Space, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../api/client';
import type { ColumnsType } from 'antd/es/table';

interface Module {
    id: number;
    name: string;
    program_id: number;
    program_name?: string;
    professor_id?: number;
}

interface Program {
    id: number;
    name: string;
}

const ManageModules: React.FC = () => {
    const [modules, setModules] = useState<Module[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [modRes, progRes] = await Promise.all([
                api.get('/manage/modules'),
                api.get('/manage/programs')
            ]);
            setModules(modRes.data);
            setPrograms(progRes.data);
        } catch (err) {
            message.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (values: any) => {
        try {
            await api.post('/manage/modules', values);
            message.success('Module created successfully');
            setModalVisible(false);
            form.resetFields();
            fetchData();
        } catch (err: any) {
            message.error(err.response?.data?.detail || 'Failed to create module');
        }
    };

    const columns: ColumnsType<Module> = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Program', dataIndex: 'program_name', key: 'program' },
    ];

    return (
        <Card
            title="Manage Modules"
            extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                    Add Module
                </Button>
            }
        >
            <Table
                columns={columns}
                dataSource={modules}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title="Create Module"
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
            >
                <Form form={form} onFinish={handleCreate} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Module Name"
                        rules={[{ required: true, message: 'Please enter module name' }]}
                    >
                        <Input placeholder="e.g., Mathematics I" />
                    </Form.Item>
                    <Form.Item
                        name="program_id"
                        label="Program"
                        rules={[{ required: true, message: 'Please select a program' }]}
                    >
                        <Select placeholder="Select Program">
                            {programs.map(p => (
                                <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">Create</Button>
                            <Button onClick={() => { setModalVisible(false); form.resetFields(); }}>Cancel</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default ManageModules;
