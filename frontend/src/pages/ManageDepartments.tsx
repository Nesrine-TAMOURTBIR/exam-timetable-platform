import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Card, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../api/client';
import type { ColumnsType } from 'antd/es/table';

interface Department {
    id: number;
    name: string;
}

const ManageDepartments: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/manage/departments');
            setDepartments(res.data);
        } catch (err) {
            message.error('Failed to load departments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleCreate = async (values: { name: string }) => {
        try {
            await api.post('/manage/departments', values);
            message.success('Department created successfully');
            setModalVisible(false);
            form.resetFields();
            fetchDepartments();
        } catch (err: any) {
            message.error(err.response?.data?.detail || 'Failed to create department');
        }
    };

    const columns: ColumnsType<Department> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
    ];

    return (
        <Card
            title="Manage Departments"
            extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                    Add Department
                </Button>
            }
        >
            <Table
                columns={columns}
                dataSource={departments}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title="Create Department"
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
                        label="Department Name"
                        rules={[{ required: true, message: 'Please enter department name' }]}
                    >
                        <Input placeholder="e.g., Computer Science" />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                Create
                            </Button>
                            <Button onClick={() => {
                                setModalVisible(false);
                                form.resetFields();
                            }}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default ManageDepartments;

