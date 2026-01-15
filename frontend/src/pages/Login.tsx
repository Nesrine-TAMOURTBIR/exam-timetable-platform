import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
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
            localStorage.setItem('token', response.data.access_token);
            message.success('Accès autorisé');
            navigate('/');
        } catch (error) {
            message.error('Identifiants invalides');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page" style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            background: 'var(--tech-bg-dark)',
            overflow: 'hidden'
        }}>
            {/* Background Tech Elements */}
            <div className="tech-blob" style={{ position: 'absolute', top: '15%', left: '10%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }} />
            <div className="tech-cross" style={{ position: 'absolute', bottom: '20%', right: '15%', fontSize: '40px', color: 'rgba(255,255,255,0.05)', fontWeight: 100 }}>+</div>

            <div style={{ marginBottom: 40, textAlign: 'center', zIndex: 1 }}>
                <Title level={1} style={{ color: '#fff', margin: 0, letterSpacing: '2px', fontWeight: 700 }}>EXAMIFY</Title>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', textTransform: 'uppercase', marginTop: 8 }}>Plateforme Institutionnelle</div>
            </div>

            <Card className="glass-card" style={{ width: '90%', maxWidth: '400px', border: 'none', zIndex: 1 }}>
                <Form onFinish={onFinish} size="large" layout="vertical">
                    <Form.Item name="email" rules={[{ required: true }]}>
                        <Input
                            placeholder="ADRESSE EMAIL"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
                        />
                    </Form.Item>
                    <Form.Item name="password" rules={[{ required: true }]}>
                        <Input.Password
                            placeholder="MOT DE PASSE"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 12 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            style={{
                                width: '100%',
                                background: '#fff',
                                color: '#000',
                                border: 'none',
                                height: '48px',
                                fontWeight: 700,
                                borderRadius: '24px'
                            }}
                        >
                            LOG IN <RocketOutlined style={{ marginLeft: 8 }} />
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <Button type="link" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                            IDENTIFIANTS OUBLIÉS ?
                        </Button>
                    </div>

                    <div style={{ marginTop: 32, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', margin: 0 }}>
                            Accès restreint aux membres de l'université
                        </p>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Login;
