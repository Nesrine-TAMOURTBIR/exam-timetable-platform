import React, { useEffect, useState } from 'react';
import { Table, Tag, Card, message, Select, Space, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import api from '../api/client';
import moment from 'moment';

interface TimetableEntry {
    id: number;
    start_time: string;
    end_time: string;
    exam_name: string;
    room_name: string;
    supervisor_name: string;
    status: string;
}

const TimetableView: React.FC = () => {
    const [data, setData] = useState<TimetableEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [departments, setDepartments] = useState<any[]>([]);
    const [programs, setPrograms] = useState<any[]>([]);
    const [selectedDept, setSelectedDept] = useState<number | null>(null);
    const [selectedProg, setSelectedProg] = useState<number | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (selectedDept) params.department_id = selectedDept;
            if (selectedProg) params.program_id = selectedProg;

            console.log('[TIMETABLE] Fetching with params:', params);
            const res = await api.get('/timetable/', { params });

            if (res.data.length === 0 && !selectedDept && !selectedProg) {
                console.log('[TIMETABLE] Role-specific view is empty, falling back to global view...');
                const globalRes = await api.get('/timetable/'); // Fetch without role filters if possible, or just raw
                setData(globalRes.data);
            } else {
                setData(res.data);
            }
        } catch (err) {
            console.error('[TIMETABLE] Error, trying global fallback...', err);
            try {
                const globalRes = await api.get('/timetable/');
                setData(globalRes.data);
                message.info('Affichage du planning global (Vue spécifique indisponible)');
            } catch (fallbackErr) {
                message.error('Impossible de charger le planning');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const userRes = await api.get('/login/me');
                setUser(userRes.data);

                const deptsRes = await api.get('/manage/departments');
                setDepartments(deptsRes.data);

                const progsRes = await api.get('/manage/programs');
                setPrograms(progsRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchInitial();
        fetchData();
    }, []);

    useEffect(() => {
        fetchData();
    }, [selectedDept, selectedProg]);

    const handleValidateDept = async () => {
        if (!user || !user.department_id) return;
        try {
            await api.post(`/workflow/validate-dept/${user.department_id}`);
            message.success('Department validated successfully');
            fetchData();
        } catch (err: any) {
            message.error('Validation failed: ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleApproveFinal = async () => {
        try {
            await api.post('/workflow/approve-final');
            message.success('Timetable approved finally');
            fetchData();
        } catch (err: any) {
            message.error('Approval failed: ' + (err.response?.data?.detail || err.message));
        }
    };

    const columns: ColumnsType<TimetableEntry> = [
        {
            title: 'Date',
            key: 'date',
            render: (_, record) => moment(record.start_time).format('YYYY-MM-DD'),
            sorter: (a, b) => moment(a.start_time).unix() - moment(b.start_time).unix(),
        },
        {
            title: 'Time',
            key: 'time',
            render: (_, record) => `${moment(record.start_time).format('HH:mm')} - ${moment(record.end_time).format('HH:mm')}`,
        },
        {
            title: 'Module',
            dataIndex: 'exam_name',
            key: 'exam_name',
        },
        {
            title: 'Room',
            dataIndex: 'room_name',
            key: 'room_name',
            render: (text) => <Tag color="blue">{text}</Tag>
        },
        {
            title: 'Supervisor',
            dataIndex: 'supervisor_name',
            key: 'supervisor_name',
            render: (text) => <span style={{ fontStyle: 'italic' }}>{text}</span>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'default';
                if (status === 'DEPT_APPROVED') color = 'blue';
                if (status === 'FINAL_APPROVED') color = 'green';
                return <Tag color={color}>{(status || '').replace('_', ' ')}</Tag>;
            }
        },
    ];

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card title="Filters" size="small" className="glass-card">
                <Space wrap style={{ width: '100%' }} direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'}>
                    <Select
                        placeholder="Filter by Department"
                        style={{ width: window.innerWidth < 768 ? '100%' : 200 }}
                        allowClear
                        onChange={setSelectedDept}
                        options={departments.map(d => ({ label: d.name, value: d.id }))}
                    />
                    <Select
                        placeholder="Filter by Program"
                        style={{ width: window.innerWidth < 768 ? '100%' : 200 }}
                        allowClear
                        onChange={setSelectedProg}
                        options={programs.filter(p => !selectedDept || p.department_id === selectedDept).map(p => ({ label: p.name, value: p.id }))}
                    />
                </Space>
            </Card>

            <Card
                title="Exam Timetable"
                className="glass-card"
                extra={
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                            danger
                            type="dashed"
                            onClick={() => {
                                setSelectedDept(null);
                                setSelectedProg(null);
                                fetchData();
                            }}
                        >
                            VUE COMPLÈTE (URGENCE)
                        </Button>
                        {user?.role === 'head' && (
                            <Button type="primary" onClick={handleValidateDept}>Validate My Dept</Button>
                        )}
                        {(user?.role === 'dean' || user?.role === 'vice_dean') && (
                            <Button type="primary" style={{ background: '#52c41a' }} onClick={handleApproveFinal}>Final Approval</Button>
                        )}
                    </div>
                }
            >
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </Space>
    );
};

export default TimetableView;
