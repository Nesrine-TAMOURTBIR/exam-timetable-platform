import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Button, message, Alert, Divider } from 'antd';
import { RocketOutlined, CheckCircleOutlined, UserOutlined, BookOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie } from 'recharts';
import api from '../api/client';
import TimetableView from './TimetableView';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
            const userRes = await api.get('/login/me');
            setUser(userRes.data);

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
                    <h2 style={{ margin: 0 }}>Welcome, {user.full_name}</h2>
                    <span style={{ color: '#666', textTransform: 'capitalize' }}>{user.role} Dashboard</span>
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
                <>
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col span={6}>
                            <Card bordered={false} className="stat-card">
                                <Statistic title="Students" value={stats.total_students} prefix={<UserOutlined />} />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card bordered={false} className="stat-card">
                                <Statistic title="Professors" value={stats.total_profs} prefix={<UserOutlined />} />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card bordered={false} className="stat-card">
                                <Statistic title="Scheduled Exams" value={stats.total_exams} prefix={<BookOutlined />} />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card bordered={false} className="stat-card">
                                <Statistic title="Opt. Score" value={98} suffix="%" prefix={<CheckCircleOutlined />} />
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col span={12}>
                            <Card title={<span><BarChartOutlined /> Exams per Day</span>} bordered={false}>
                                <div style={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.exams_by_day}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#1890ff" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card title={<span><PieChartOutlined /> Room Occupancy (%)</span>} bordered={false}>
                                <div style={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart layout="vertical" data={stats.room_occupancy}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" domain={[0, 100]} />
                                            <YAxis dataKey="name" type="category" width={80} />
                                            <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                                            <Bar dataKey="rate" fill="#722ed1" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col span={24}>
                            <Card title={<span><LineChartOutlined /> Professor Supervision Distribution (Equality Check)</span>} bordered={false}>
                                <div style={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.prof_load}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="count" name="Supervisions" fill="#13c2c2" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </>
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

            <Card title={isManager ? "Master Schedule Overview" : "My Upcoming Exams"} bordered={false}>
                <TimetableView />
            </Card>
        </div>
    );
};

export default Dashboard;
