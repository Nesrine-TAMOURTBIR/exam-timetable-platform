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

            if (['admin', 'dean', 'head', 'vice_dean'].includes(userRes.data.role)) {
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

    const isDean = ['dean', 'vice_dean'].includes(user.role);
    const isAdmin = user.role === 'admin';
    const isHead = user.role === 'head';
    const isManager = isDean || isAdmin || isHead;

    return (
        <div>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Welcome, {user.full_name}</h2>
                    <span style={{ color: '#666', textTransform: 'capitalize' }}>
                        {user.role.replace('_', ' ')} Dashboard
                    </span>
                </div>
                {isAdmin && (
                    <Button
                        type="primary"
                        size="large"
                        icon={optimizing ? <CheckCircleOutlined spin /> : <RocketOutlined />}
                        onClick={runOptimization}
                        loading={optimizing}
                        disabled={optimizing}
                        style={{ background: 'linear-gradient(45deg, #1890ff, #722ed1)', border: 'none' }}
                    >
                        {optimizing ? 'Generating EDT...' : 'Generate New Timetable'}
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
                                <Statistic
                                    title="Avg Room Occupancy"
                                    value={stats.occupancy_rate}
                                    suffix="%"
                                    precision={1}
                                    valueStyle={{ color: stats.occupancy_rate > 80 ? '#cf1322' : '#3f51b5' }}
                                    prefix={<PieChartOutlined />}
                                />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card bordered={false} className="stat-card">
                                <Statistic
                                    title="Quality Score"
                                    value={stats.quality_score}
                                    suffix="%"
                                    precision={1}
                                    valueStyle={{ color: stats.quality_score > 90 ? '#52c41a' : '#faad14' }}
                                    prefix={<CheckCircleOutlined />}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col span={isDean ? 8 : 12}>
                            <Card title={<span><BarChartOutlined /> {isHead ? 'Conflicts per Program' : 'Conflicts per Department'}</span>} bordered={false}>
                                <div style={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={isHead ? stats.conflicts_by_program : stats.conflicts_by_dept}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="conflict_count" fill="#ff4d4f" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Col>
                        {isDean && (
                            <Col span={8}>
                                <Card title={<span><CheckCircleOutlined /> Validation Funnel</span>} bordered={false}>
                                    <div style={{ height: 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Draft', value: stats.validation_status.DRAFT },
                                                        { name: 'Dept Approved', value: stats.validation_status.DEPT_APPROVED },
                                                        { name: 'Final Approved', value: stats.validation_status.FINAL_APPROVED },
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    <Cell fill="#bfbfbf" />
                                                    <Cell fill="#1890ff" />
                                                    <Cell fill="#52c41a" />
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            </Col>
                        )}
                        {(isDean || isAdmin) && (
                            <Col span={isDean ? 8 : 12}>
                                <Card title={<span><PieChartOutlined /> {isDean ? 'Institution-wide Room Usage' : 'Room Occupancy (%)'}</span>} bordered={false}>
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
                        )}
                    </Row>

                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        {isAdmin && (
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
                        )}
                        <Col span={isAdmin ? 12 : 24}>
                            <Card title={<span><LineChartOutlined /> Professor Load {isHead ? '(Our Dept)' : '(Top 10 Institutional)'}</span>} bordered={false}>
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
