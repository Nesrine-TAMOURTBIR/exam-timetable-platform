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

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginTop: 16 }}>
                            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Comptes de Démo (Tous mdp: <b>secret</b>):</p>
                            <div style={{ fontSize: '11px', color: '#555' }}>
                                • <b>Admin (Directeur)</b>: admin@example.com<br />
                                • <b>Doyen</b>: dean@example.com<br />
                                • <b>Chef Dept</b>: head@example.com<br />
                                • <b>Professeur</b>: prof@example.com<br />
                                • <b>Étudiant</b>: student@example.com
                            </div>
                        </div>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Login;
