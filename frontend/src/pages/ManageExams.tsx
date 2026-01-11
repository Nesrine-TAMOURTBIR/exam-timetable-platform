import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, InputNumber, message, Card, Space, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../api/client';
import type { ColumnsType } from 'antd/es/table';

interface Exam {
    id: number;
    module_id: number;
    module_name?: string;
    duration_minutes: number;
}

interface Module {
    id: number;
    name: string;
}

const ManageExams: React.FC = () => {
    const [exams, setExams] = useState<Exam[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [exRes, modRes] = await Promise.all([
                api.get('/manage/exams'),
                api.get('/manage/modules')
            ]);
            setExams(exRes.data);
            setModules(modRes.data);
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
            await api.post('/manage/exams', values);
            message.success('Exam created successfully');
            setModalVisible(false);
            form.resetFields();
            fetchData();
        } catch (err: any) {
            message.error(err.response?.data?.detail || 'Failed to create exam');
        }
    };

    const columns: ColumnsType<Exam> = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        { title: 'Module', dataIndex: 'module_name', key: 'module' },
        { title: 'Duration (min)', dataIndex: 'duration_minutes', key: 'duration' },
    ];

    return (
        <Card
            title="Manage Exams"
            extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                    Add Exam
                </Button>
            }
        >
            <Table
                columns={columns}
                dataSource={exams}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title="Create Exam"
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
            >
                <Form form={form} onFinish={handleCreate} layout="vertical">
                    <Form.Item
                        name="module_id"
                        label="Module"
                        rules={[{ required: true, message: 'Please select a module' }]}
                    >
                        <Select placeholder="Select Module" showSearch optionFilterProp="children">
                            {modules.map(m => (
                                <Select.Option key={m.id} value={m.id}>{m.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="duration_minutes"
                        label="Duration (minutes)"
                        initialValue={90}
                        rules={[{ required: true, message: 'Please enter duration' }]}
                    >
                        <InputNumber min={30} max={240} style={{ width: '100%' }} />
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

export default ManageExams;
