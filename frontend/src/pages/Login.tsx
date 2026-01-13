import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const { Title } = Typography;

const Login: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('username', values.email);
            formData.append('password', values.password);

            const response = await api.post('/login/access-token', formData);
            const { access_token } = response.data;

            localStorage.setItem('token', access_token);
            message.success('Login successful');

            // simple redirect
            navigate('/');
        } catch (error) {
            console.error(error);
            message.error('Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5', position: 'relative' }}>
            <Button
                type="text"
                icon={<HomeOutlined style={{ fontSize: '24px' }} />}
                style={{ position: 'absolute', top: 20, left: 20 }}
                onClick={() => navigate('/')}
            />
            <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <Title level={3}>Exam Scheduler</Title>
                    <p>University of Excellence</p>
                </div>
                <Form
                    name="login"
                    onFinish={onFinish}
                    size="large"
                >
                    <Form.Item
                        name="email"
                        rules={[{ required: true, message: 'Please input your Email!' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Email" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your Password!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
                            Log in
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center', color: '#888', fontSize: '12px' }}>
                        <p style={{ margin: 0 }}>Demo Credentials (Password: <b>secret</b>)</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span>Admin: admin@example.com</span>
                            <span>Dean: dean@example.com | Vice-Dean: vicedean@example.com</span>
                            <span>Head: head@example.com | Prof: prof@example.com</span>
                            <span>Student: student@example.com</span>
                        </div>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Login;
