import React, { useEffect, useState } from 'react';
import { Table, Tag, Card, message } from 'antd';
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
}

const TimetableView: React.FC = () => {
    const [data, setData] = useState<TimetableEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/timetable/');
            setData(res.data);
        } catch (err) {
            message.error('Failed to load timetable');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
    ];

    return (
        <Card title="Exam Timetable" className="glass-card">
            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
        </Card>
    );
};

export default TimetableView;
