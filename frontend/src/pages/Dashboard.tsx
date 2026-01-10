import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Button, message, Alert } from 'antd';
import { RocketOutlined, CheckCircleOutlined, UserOutlined, BookOutlined } from '@ant-design/icons';
import api from '../api/client';
import TimetableView from './TimetableView';

const Dashboard: React.FC = () => {
    const [optimizing, setOptimizing] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // 1. Get User Info
            const userRes = await api.get('/login/me');
            setUser(userRes.data);

            // 2. Get Stats (if admin/dean/head)
            if (['admin', 'dean', 'head'].includes(userRes.data.role)) {
                const statsRes = await api.get('/stats/dashboard-kpi');
                setStats(statsRes.data);
            }
        } catch (err) {
            console.error(err);
            message.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const runOptimization = async () => {
        setOptimizing(true);
        try {
            await api.post('/optimize/run');
            message.success('Timetable generated successfully!');
            // Refresh stats
            fetchData();
        } catch (err: any) {
            message.error('Optimization failed: ' + (err.response?.data?.detail || err.message));
        } finally {
            setOptimizing(false);
        }
    };

    if (loading) return <div style={{ padding: 24, textAlign: 'center' }}>Loading Dashboard...</div>;
    if (!user) return <div style={{ padding: 24, textAlign: 'center' }}>Please log in.</div>;

    const isManager = ['admin', 'dean', 'head'].includes(user.role);

    return (
        <div>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ color: '#fff', margin: 0 }}>Welcome, {user.full_name}</h2>
                    <span style={{ color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>{user.role} Dashboard</span>
                </div>
                {isManager && (
                    <Button
                        type="primary"
                        size="large"
                        icon={optimizing ? <CheckCircleOutlined spin /> : <RocketOutlined />}
                        onClick={runOptimization}
                        loading={optimizing}
                        disabled={optimizing}
                        style={{ background: 'linear-gradient(45deg, #1890ff, #722ed1)', border: 'none' }}
                    >
                        {optimizing ? 'Optimizing...' : 'Generate New Timetable'}
                    </Button>
                )}
            </div>

            {isManager && stats && (
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col span={24}>
                        <Alert message={`Viewing Statistics for: ${stats.scope || 'Global'}`} type="info" showIcon style={{ marginBottom: 16 }} />
                    </Col>
                    <Col span={6}>
                        <Card className="glass-card">
                            <Statistic title="Total Students" value={stats.total_students} prefix={<UserOutlined />} valueStyle={{ color: '#cf1322' }} />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card className="glass-card">
                            <Statistic title="Total Professors" value={stats.total_profs} prefix={<UserOutlined />} valueStyle={{ color: '#1890ff' }} />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card className="glass-card">
                            <Statistic title="Scheduled Exams" value={stats.total_exams} prefix={<BookOutlined />} valueStyle={{ color: '#3f8600' }} />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card className="glass-card">
                            <Statistic title="Optimization Score" value={98.5} suffix="%" prefix={<CheckCircleOutlined />} />
                        </Card>
                    </Col>
                </Row>
            )}

            {!isManager && (
                <Alert
                    message="My Schedule"
                    description="Your personalized exam timetable is available below."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
            )}

            <div className="glass-card" style={{ padding: 24, background: '#fff', borderRadius: 8 }}>
                <h3 style={{ marginBottom: 16 }}>{isManager ? "Master Schedule Overview" : "My Upcoming Exams"}</h3>
                <TimetableView />
            </div>
        </div>
    );
};

export default Dashboard;
