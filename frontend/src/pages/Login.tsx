import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Modal } from 'antd';
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
            {/* Animated Background Blobs for "Wow" Factor */}
            <div className="tech-bg-anim">
                <div className="blob blob-1"></div>
                <div className="blob blob-2" style={{ background: 'radial-gradient(circle, var(--tech-accent) 0%, transparent 60%)' }}></div>
            </div>

            <div style={{ marginBottom: 40, textAlign: 'center', zIndex: 1, animation: 'fadeInDown 1s ease' }}>
                <Title level={1} style={{ color: '#fff', margin: 0, letterSpacing: '4px', fontWeight: 900 }}>EXAMIFY</Title>
                <div style={{ color: 'var(--tech-primary)', fontSize: '10px', textTransform: 'uppercase', marginTop: 8, letterSpacing: '2px', fontWeight: 600 }}>
                    UNIVERSITY SCHEDULING SYSTEM
                </div>
            </div>

            <Card className="glass-card" style={{ width: '90%', maxWidth: '420px', border: 'none', zIndex: 1, padding: '24px 12px' }}>
                <Form onFinish={onFinish} size="large" layout="vertical">
                    <Form.Item name="email" rules={[{ required: true }]}>
                        <Input
                            placeholder="ADRESSE EMAIL"
                            className="tech-input"
                            style={{
                                height: '50px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: '#fff'
                            }}
                        />
                    </Form.Item>
                    <Form.Item name="password" rules={[{ required: true }]}>
                        <Input.Password
                            placeholder="MOT DE PASSE"
                            className="tech-input"
                            style={{
                                height: '50px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: '#fff'
                            }}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginTop: 24, marginBottom: 12 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            style={{
                                width: '100%',
                                background: '#fff',
                                color: '#000',
                                border: 'none',
                                height: '54px',
                                fontWeight: 800,
                                borderRadius: '27px',
                                fontSize: '14px',
                                letterSpacing: '1px',
                                boxShadow: '0 4px 15px rgba(255,255,255,0.2)'
                            }}
                        >
                            ACCÉDER AU PORTAIL <RocketOutlined style={{ marginLeft: 12 }} />
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <Button
                            type="link"
                            style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.5px' }}
                            onClick={() => {
                                Modal.info({
                                    title: 'Identifiants de Test (Mode Démo)',
                                    width: 400,
                                    content: (
                                        <div style={{ marginTop: 16 }}>
                                            <p><strong>Admin:</strong> admin@example.com / secret</p>
                                            <p><strong>Chef Dept:</strong> head@example.com / secret</p>
                                            <p><strong>Professor:</strong> prof@example.com / secret</p>
                                            <p><strong>Student:</strong> student@example.com / secret</p>
                                            <div style={{ marginTop: 16, fontSize: '12px', color: '#888' }}>
                                                Note: Si le login échoue, assurez-vous que le backend est bien déployé et "Live" sur Render.
                                            </div>
                                        </div>
                                    ),
                                    okText: 'Compris'
                                });
                            }}
                        >
                            SUPPORT TECHNIQUE / IDENTIFIANTS OUBLIÉS
                        </Button>
                    </div>
                </Form>
            </Card>

            <div style={{
                position: 'absolute',
                bottom: '20px',
                color: 'rgba(255,255,255,0.2)',
                fontSize: '9px',
                letterSpacing: '1px'
            }}>
                V1.0.4-RELEASE • SECURITY HARDENED
            </div>
        </div>
    );
};

export default Login;
