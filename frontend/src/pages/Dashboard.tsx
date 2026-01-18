import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Button, message, Alert, Table, Tag } from 'antd';
import { RocketOutlined, CheckCircleOutlined, UserOutlined, BookOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined, AreaChartOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import api from '../api/client';
import TimetableView from './TimetableView';



const Dashboard: React.FC = () => {
    const [optimizing, setOptimizing] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [detailedConflicts, setDetailedConflicts] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const userRes = await api.get('/login/me');
            setUser(userRes.data);

            if (['admin', 'dean', 'head', 'vice_dean'].includes(userRes.data.role)) {
                const statsRes = await api.get('/stats/dashboard-kpi');
                setStats(statsRes.data);

                if (userRes.data.role === 'admin') {
                    const confRes = await api.get('/stats/conflicts-detailed');
                    setDetailedConflicts(confRes.data);
                }
            }
        } catch (err: any) {
            console.error("Dashboard Load Error:", err);
            setError(err.message || "Impossible de charger les données. Vérifiez votre connexion ou le statut du serveur.");
            message.error("Erreur de chargement des données");
        } finally {
            setLoading(false);
        }
    };

    const [generatingDraft, setGeneratingDraft] = useState(false);

    const runDraft = async () => {
        setGeneratingDraft(true);
        try {
            await api.post('/optimize/draft');
            message.success('Ébauche générée avec succès !');
            fetchData();
        } catch (err: any) {
            message.error('Erreur lors de la génération de l\'ébauche: ' + (err.response?.data?.detail || err.message));
        } finally {
            setGeneratingDraft(false);
        }
    };

    const runOptimization = async () => {
        setOptimizing(true);
        try {
            await api.post('/optimize/run');
            message.success('Optimisation terminée !');
            fetchData();
        } catch (err: any) {
            message.error('Optimization failed: ' + (err.response?.data?.detail || err.message));
        } finally {
            setOptimizing(false);
        }
    };

    if (loading) return (
        <div style={{ padding: '48px', textAlign: 'center', color: '#fff' }}>
            <div className="spinner" style={{ marginBottom: 16 }}></div>
            <h3 style={{ color: '#fff' }}>Chargement du Dashboard...</h3>
        </div>
    );

    if (error) return (
        <div style={{ padding: '48px', textAlign: 'center', color: '#fff' }}>
            <Alert
                message="Erreur de Connexion"
                description={error}
                type="error"
                showIcon
                action={
                    <Button size="small" type="primary" danger onClick={fetchData}>
                        Réessayer
                    </Button>
                }
                style={{ maxWidth: 500, margin: '0 auto' }}
            />
        </div>
    );

    if (!user) return <div style={{ padding: 24, textAlign: 'center', color: '#fff' }}>Veuillez vous reconnecter.</div>;

    const isDean = ['dean', 'vice_dean'].includes(user.role);
    const isAdmin = user.role === 'admin';
    const isHead = user.role === 'head';
    const isManager = isDean || isAdmin || isHead;

    const themeColor = isAdmin ? '#1890ff' : isDean ? '#722ed1' : isHead ? '#13c2c2' : '#52c41a';

    const renderActionSection = () => {
        if (isAdmin) {
            return (
                <div style={{ background: '#e6f7ff', padding: '16px 24px', borderRadius: '12px', border: '1px solid #91d5ff', marginBottom: '24px' }}>
                    <Row align="middle" gutter={[16, 16]}>
                        <Col xs={24} md={12} lg={16}>
                            <h3 style={{ margin: 0, color: '#0050b3' }}>Outil de Génération Automatique</h3>
                            <p style={{ margin: 0 }}>Générer un nouvel emploi du temps. Commencez par une ébauche rapide, puis optimisez.</p>
                        </Col>
                        <Col xs={24} md={12} lg={8} style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <Button
                                size="large"
                                icon={<RocketOutlined />}
                                loading={generatingDraft}
                                disabled={optimizing}
                                onClick={runDraft}
                                style={{ borderRadius: '8px', flex: '1 1 auto' }}
                            >
                                {generatingDraft ? 'Génération...' : 'Générer Ébauche'}
                            </Button>
                            <Button
                                type="primary"
                                size="large"
                                icon={<BarChartOutlined />}
                                loading={optimizing}
                                disabled={generatingDraft}
                                onClick={runOptimization}
                                style={{ borderRadius: '8px', flex: '1 1 auto' }}
                            >
                                {optimizing ? 'Optimisation...' : 'Optimiser'}
                            </Button>
                        </Col>
                    </Row>
                </div>
            );
        }
        if (isDean) {
            return (
                <div style={{ background: '#f9f0ff', padding: '24px', borderRadius: '12px', border: '1px solid #d3adf7', marginBottom: '24px' }}>
                    <Row align="middle" gutter={24}>
                        <Col flex="auto">
                            <h3 style={{ margin: 0, color: '#391085' }}>Approbation Stratégique</h3>
                            <p style={{ margin: 0 }}>Valider officiellement toutes les planifications approuvées par les départements pour publication.</p>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                size="large"
                                icon={<CheckCircleOutlined />}
                                onClick={async () => {
                                    try {
                                        await api.post('/workflow/approve-final');
                                        message.success('Planning institutionnel validé avec succès !');
                                        fetchData();
                                    } catch (err) {
                                        message.error('Erreur de validation');
                                    }
                                }}
                                style={{ background: '#722ed1', borderColor: '#722ed1', borderRadius: '8px' }}
                            >
                                Approuver Tout (Final)
                            </Button>
                        </Col>
                    </Row>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ padding: '0 8px' }}>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: '24px', color: themeColor }}>Bienvenue, {user?.full_name || 'Utilisateur'}</h2>
                <span style={{ color: '#8c8c8c', textTransform: 'capitalize', fontWeight: 500 }}>
                    Espace {(user?.role || '').replace('_', ' ')} — Université d'Excellence
                </span>
            </div>

            {renderActionSection()}

            {isManager && stats && (
                <>
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} sm={12} lg={6}>
                            <Card bordered={false} hoverable style={{ borderLeft: `4px solid ${themeColor}` }}>
                                <Statistic title="Total Étudiants" value={stats.total_students} prefix={<UserOutlined style={{ color: themeColor }} />} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card bordered={false} hoverable style={{ borderLeft: `4px solid ${themeColor}` }}>
                                <Statistic title="Total Professeurs" value={stats.total_profs} prefix={<UserOutlined style={{ color: themeColor }} />} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={isDean ? 6 : 6}>
                            <Card bordered={false} hoverable style={{ borderLeft: `4px solid ${themeColor}` }}>
                                <Statistic
                                    title={isDean ? "Taux d'Occupation" : "Examens Planifiés"}
                                    value={isDean ? stats.occupancy_rate : stats.total_exams}
                                    suffix={isDean ? "%" : ""}
                                    precision={isDean ? 1 : 0}
                                    prefix={isDean ? <PieChartOutlined style={{ color: themeColor }} /> : <BookOutlined style={{ color: themeColor }} />}
                                />
                            </Card>
                        </Col>
                        {isDean ? (
                            <>
                                <Col xs={24} sm={12} lg={6}>
                                    <Card bordered={false} hoverable style={{ borderLeft: `4px solid ${themeColor}` }}>
                                        <Statistic
                                            title="Qualité"
                                            value={stats.quality_score}
                                            suffix="%"
                                            precision={1}
                                            valueStyle={{ color: stats.quality_score > 90 ? '#52c41a' : '#faad14' }}
                                            prefix={<CheckCircleOutlined />}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} md={24} lg={24}>
                                    <Card bordered={false} hoverable style={{ borderLeft: `4px solid #722ed1`, background: '#f9f0ff' }}>
                                        <Statistic
                                            title="Gain de Performance"
                                            value={stats.optimization_gain}
                                            suffix="%"
                                            precision={1}
                                            valueStyle={{ color: '#722ed1' }}
                                            prefix={<RocketOutlined />}
                                        />
                                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Diminution des collisions par rapport au planning brut</div>
                                    </Card>
                                </Col>
                            </>
                        ) : (
                            <>
                                <Col xs={24} sm={12} lg={6}>
                                    <Card bordered={false} hoverable style={{ borderLeft: `4px solid ${themeColor}` }}>
                                        <Statistic
                                            title="Qualité"
                                            value={stats.quality_score}
                                            suffix="%"
                                            precision={1}
                                            valueStyle={{ color: stats.quality_score > 90 ? '#52c41a' : '#faad14' }}
                                            prefix={<CheckCircleOutlined />}
                                        />
                                    </Card>
                                </Col>
                                {isAdmin && (
                                    <Col xs={24} sm={12} lg={6}>
                                        <Card bordered={false} hoverable style={{ borderLeft: `4px solid #fa8c16` }}>
                                            <Statistic
                                                title="Gaspillage Salles"
                                                value={stats.room_waste_pct}
                                                suffix="%"
                                                precision={1}
                                                valueStyle={{ color: stats.room_waste_pct < 20 ? '#52c41a' : '#fa8c16' }}
                                                prefix={<AreaChartOutlined />}
                                            />
                                        </Card>
                                    </Col>
                                )}
                            </>
                        )}
                    </Row>

                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={12} lg={isDean ? 8 : 12}>
                            <Card title={<span><BarChartOutlined /> {isHead ? 'Conflits par Formation' : 'Conflits par Département'}</span>} bordered={false} hoverable>
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
                        <Col xs={24} md={12} lg={isDean ? 8 : 12}>
                            <Card title={<span><CheckCircleOutlined /> État des Validations (Doyen)</span>} bordered={false} className="glass-card">
                                <div style={{ height: 300, minHeight: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'En Brouillon', value: stats.validation_status.DRAFT },
                                                    { name: 'Validé Dept', value: stats.validation_status.DEPT_APPROVED },
                                                    { name: 'Validé Final', value: stats.validation_status.FINAL_APPROVED },
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
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Col>
                        {(isDean || isAdmin) && (
                            <Col xs={24} md={24} lg={isDean ? 8 : 12}>
                                <Card title={<span><PieChartOutlined /> {isDean ? 'Institution-wide Room Usage' : 'Room Occupancy (%)'}</span>} bordered={false}>
                                    <div style={{ height: 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart layout="vertical" data={stats.room_occupancy}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" domain={[0, 100]} />
                                                <YAxis dataKey="name" type="category" width={80} />
                                                <Tooltip formatter={(value: any) => [`${parseFloat(value).toFixed(1)}%`, 'Rate']} />
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
                            <Col xs={24} lg={12}>
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
                        <Col xs={24} lg={isAdmin ? 12 : 24}>
                            <Card title={<span><LineChartOutlined /> Professor Load {isHead ? '(Our Dept)' : '(Top 10 Institutional)'}</span>} bordered={false}>
                                <div style={{ height: 300, width: '100%' }}>
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

            {(isAdmin || isHead) && detailedConflicts.length > 0 && (
                <Card
                    title={<span style={{ color: '#cf1322' }}><BarChartOutlined /> {isHead ? 'Audit des Conflits de Département' : 'Audit des Conflits Résiduels'}</span>}
                    style={{ marginBottom: 24, border: '1px solid #ffa39e' }}
                    className="glass-card"
                >
                    <Table
                        dataSource={detailedConflicts}
                        pagination={{ pageSize: 5 }}
                        columns={[
                            { title: 'Type', dataIndex: 'type', key: 'type', render: (t) => <Tag color={t.includes('Salle') ? 'volcano' : 'red'}>{t}</Tag> },
                            { title: 'Cible', dataIndex: 'target', key: 'target', render: (text) => <b>{text}</b> },
                            { title: 'Détails', dataIndex: 'detail', key: 'detail' },
                        ]}
                    />
                </Card>
            )}

            <Card title={isManager ? "Vue d'Ensemble du Planning" : "Mes Examens à Venir"} bordered={false}>
                <TimetableView />
            </Card>
        </div>
    );
};

export default Dashboard;
