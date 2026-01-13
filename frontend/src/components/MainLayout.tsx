import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Avatar } from 'antd';
import { UserOutlined, LogoutOutlined, CalendarOutlined, DashboardOutlined, SettingOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState<any>(null);

    const themeColor = user?.role === 'admin' ? '#1890ff' :
        (user?.role === 'dean' || user?.role === 'vice_dean') ? '#722ed1' :
            user?.role === 'head' ? '#13c2c2' : '#52c41a';

    // Check auth and fetch user
    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const res = await api.get('/login/me');
                setUser(res.data);
            } catch (err) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        };
        fetchUser();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };



    const getMenuItems = (): any[] => {
        if (!user) return [];

        const items: any[] = [
            { key: '/', icon: <DashboardOutlined />, label: 'Dashboard', onClick: () => navigate('/') },
            { key: '/timetable', icon: <CalendarOutlined />, label: 'Timetable', onClick: () => navigate('/timetable') },
        ];

        if (user.role === 'admin') {
            items.push({
                key: '/settings-group',
                icon: <SettingOutlined />,
                label: 'Settings',
                children: [
                    { key: '/manage/departments', label: 'Departments', onClick: () => navigate('/manage/departments') },
                    { key: '/manage/rooms', label: 'Rooms', onClick: () => navigate('/manage/rooms') },
                    { key: '/manage/programs', label: 'Programs', onClick: () => navigate('/manage/programs') },
                    { key: '/manage/modules', label: 'Modules', onClick: () => navigate('/manage/modules') },
                    { key: '/manage/users', label: 'Users', onClick: () => navigate('/manage/users') },
                    { key: '/manage/exams', label: 'Exams', onClick: () => navigate('/manage/exams') },
                ]
            });
        }

        if (user.role === 'dean' || user.role === 'vice_dean') {
            items.push(
                { key: '/manage/users', icon: <UserOutlined />, label: 'User Management', onClick: () => navigate('/manage/users') },
            );
        }

        return items;
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
                <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6 }} />
                <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={getMenuItems()} />
            </Sider>
            <Layout className="site-layout">
                <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#001529' }}>
                        Portal d'Examens <span style={{ color: '#8c8c8c', fontWeight: 'normal', fontSize: '14px' }}>| {user?.role?.toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginRight: 24 }}>
                            <div style={{ textAlign: 'right', marginRight: 12 }}>
                                <div style={{ fontWeight: 600, lineHeight: '18px' }}>{user?.full_name || 'Chargement...'}</div>
                                <div style={{ fontSize: '11px', color: '#8c8c8c', textTransform: 'uppercase' }}>{user?.role}</div>
                            </div>
                            <Avatar size="large" icon={<UserOutlined />} style={{ backgroundColor: themeColor }} />
                        </div>
                        <Button
                            type="text"
                            icon={<LogoutOutlined />}
                            onClick={handleLogout}
                            danger
                        >
                            Déconnexion
                        </Button>
                    </div>
                </Header>
                <Content style={{ margin: '16px' }}>
                    <div style={{ padding: 24, minHeight: 360, background: '#fff', borderRadius: 8 }}>
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
