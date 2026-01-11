import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Card, Space, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../api/client';
import type { ColumnsType } from 'antd/es/table';

interface Program {
    id: number;
    name: string;
    department_id: number;
}

interface Department {
    id: number;
    name: string;
}

const ManagePrograms: React.FC = () => {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [progRes, deptRes] = await Promise.all([
                api.get('/manage/programs'),
                api.get('/manage/departments')
            ]);
            setPrograms(progRes.data);
            setDepartments(deptRes.data);
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
            await api.post('/manage/programs', values);
            message.success('Program created successfully');
            setModalVisible(false);
            form.resetFields();
            fetchData();
        } catch (err: any) {
            message.error(err.response?.data?.detail || 'Failed to create program');
        }
    };

    const columns: ColumnsType<Program> = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { 
            title: 'Department', 
            dataIndex: 'department_id', 
            key: 'department',
            render: (id) => departments.find(d => d.id === id)?.name || id
        },
    ];

    return (
        <Card
            title="Manage Programs"
            extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                    Add Program
                </Button>
            }
        >
            <Table
                columns={columns}
                dataSource={programs}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title="Create Program"
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
                        label="Program Name"
                        rules={[{ required: true, message: 'Please enter program name' }]}
                    >
                        <Input placeholder="e.g., Bachelor in CS" />
                    </Form.Item>
                    <Form.Item
                        name="department_id"
                        label="Department"
                        rules={[{ required: true, message: 'Please select a department' }]}
                    >
                        <Select placeholder="Select Department">
                            {departments.map(d => (
                                <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
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

export default ManagePrograms;
