import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Card, Space, Select, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../api/client';
import type { ColumnsType } from 'antd/es/table';

interface User {
    id: number;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
}

const ManageUsers: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/manage/users');
            setUsers(res.data);
        } catch (err) {
            message.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreate = async (values: any) => {
        try {
            await api.post('/manage/users', values);
            message.success('User created successfully');
            setModalVisible(false);
            form.resetFields();
            fetchUsers();
        } catch (err: any) {
            message.error(err.response?.data?.detail || 'Failed to create user');
        }
    };

    const columns: ColumnsType<User> = [
        { title: 'Full Name', dataIndex: 'full_name', key: 'full_name' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role) => (
                <Tag color={role === 'admin' ? 'red' : 'blue'}>{role.toUpperCase()}</Tag>
            )
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (active) => <Tag color={active ? 'green' : 'gray'}>{active ? 'ACTIVE' : 'INACTIVE'}</Tag>
        },
    ];

    return (
        <Card
            title="Manage Users"
            extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                    Add User
                </Button>
            }
        >
            <Table
                columns={columns}
                dataSource={users}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title="Create User"
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
            >
                <Form form={form} onFinish={handleCreate} layout="vertical">
                    <Form.Item
                        name="full_name"
                        label="Full Name"
                        rules={[{ required: true, message: 'Please enter full name' }]}
                    >
                        <Input placeholder="John Doe" />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
                    >
                        <Input placeholder="john@example.com" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[{ required: true, message: 'Please enter a password' }]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="Role"
                        rules={[{ required: true, message: 'Please select a role' }]}
                    >
                        <Select placeholder="Select Role">
                            <Select.Option value="admin">Admin</Select.Option>
                            <Select.Option value="dean">Dean</Select.Option>
                            <Select.Option value="head">Head of Dept</Select.Option>
                            <Select.Option value="professor">Professor</Select.Option>
                            <Select.Option value="student">Student</Select.Option>
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

export default ManageUsers;
