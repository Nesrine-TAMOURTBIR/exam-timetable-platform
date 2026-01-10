import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Card, Space, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api/client';
import type { ColumnsType } from 'antd/es/table';

interface Room {
    id: number;
    name: string;
    capacity: number;
}

const ManageRooms: React.FC = () => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res = await api.get('/manage/rooms');
            setRooms(res.data);
        } catch (err) {
            message.error('Failed to load rooms');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const handleCreate = async (values: { name: string; capacity: number }) => {
        try {
            await api.post('/manage/rooms', values);
            message.success('Room created successfully');
            setModalVisible(false);
            form.resetFields();
            fetchRooms();
        } catch (err: any) {
            message.error(err.response?.data?.detail || 'Failed to create room');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/manage/rooms/${id}`);
            message.success('Room deleted successfully');
            fetchRooms();
        } catch (err: any) {
            message.error(err.response?.data?.detail || 'Failed to delete room');
        }
    };

    const columns: ColumnsType<Room> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: 'Room Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Capacity',
            dataIndex: 'capacity',
            key: 'capacity',
            render: (capacity) => `${capacity} seats`,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Popconfirm
                    title="Are you sure you want to delete this room?"
                    onConfirm={() => handleDelete(record.id)}
                    okText="Yes"
                    cancelText="No"
                >
                    <Button danger icon={<DeleteOutlined />} size="small">
                        Delete
                    </Button>
                </Popconfirm>
            ),
        },
    ];

    return (
        <Card
            title="Manage Rooms"
            extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                    Add Room
                </Button>
            }
        >
            <Table
                columns={columns}
                dataSource={rooms}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title="Create Room"
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
                        label="Room Name"
                        rules={[{ required: true, message: 'Please enter room name' }]}
                    >
                        <Input placeholder="e.g., Room A101" />
                    </Form.Item>
                    <Form.Item
                        name="capacity"
                        label="Capacity"
                        rules={[{ required: true, message: 'Please enter capacity' }]}
                    >
                        <InputNumber min={1} max={1000} placeholder="Number of seats" style={{ width: '100%' }} />
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

export default ManageRooms;

