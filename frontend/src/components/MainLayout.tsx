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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const themeColor = user?.role === 'admin' ? '#1890ff' :
        (user?.role === 'dean' || user?.role === 'vice_dean') ? '#722ed1' :
            user?.role === 'head' ? '#13c2c2' : '#52c41a';

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
            { key: '/timetable', icon: <CalendarOutlined />, label: 'Calendrier', onClick: () => navigate('/timetable') },
        ];

        if (user.role === 'admin') {
            items.push({
                key: '/settings-group',
                icon: <SettingOutlined />,
                label: 'Gestion',
                children: [
                    { key: '/manage/departments', label: 'Départements', onClick: () => navigate('/manage/departments') },
                    { key: '/manage/rooms', label: 'Salles', onClick: () => navigate('/manage/rooms') },
                    { key: '/manage/programs', label: 'Formations', onClick: () => navigate('/manage/programs') },
                    { key: '/manage/modules', label: 'Modules', onClick: () => navigate('/manage/modules') },
                    { key: '/manage/users', label: 'Utilisateurs', onClick: () => navigate('/manage/users') },
                    { key: '/manage/exams', label: 'Examens', onClick: () => navigate('/manage/exams') },
                ]
            });
        }

        if (user.role === 'dean' || user.role === 'vice_dean') {
            items.push(
                { key: '/manage/users', icon: <UserOutlined />, label: 'Utilisateurs', onClick: () => navigate('/manage/users') },
            );
        }

        return items;
    };

    return (
        <Layout style={{ minHeight: '100vh', background: 'var(--tech-bg-dark)' }}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                breakpoint="lg"
                collapsedWidth={isMobile ? 0 : 80}
                style={{
                    background: 'rgba(13, 17, 23, 0.95)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                    zIndex: 100
                }}
            >
                <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                    <div style={{
                        fontSize: '20px',
                        fontWeight: 900,
                        color: '#fff',
                        letterSpacing: '1px',
                        display: collapsed ? 'none' : 'block'
                    }}>EXAMIFY</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: 4, display: collapsed ? 'none' : 'block' }}>V1.0 TECH</div>
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={getMenuItems()}
                    style={{ background: 'transparent' }}
                />
            </Sider>
            <Layout style={{ background: 'transparent' }}>
                <Header style={{
                    padding: isMobile ? '0 16px' : '0 24px',
                    background: 'rgba(5, 8, 15, 0.8)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 600, color: '#fff' }}>
                        Portal <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>| {user?.role?.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {!isMobile && (
                            <div style={{ textAlign: 'right', marginRight: 12 }}>
                                <div style={{ fontSize: '13px', color: '#fff' }}>{user?.full_name}</div>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Connecté</div>
                            </div>
                        )}
                        <Avatar
                            size={isMobile ? "small" : "default"}
                            icon={<UserOutlined />}
                            style={{ backgroundColor: themeColor, marginRight: 12 }}
                        />
                        <Button
                            type="text"
                            icon={<LogoutOutlined />}
                            onClick={handleLogout}
                            style={{ color: 'rgba(255,255,255,0.4)' }}
                        />
                    </div>
                </Header>
                <Content style={{ margin: isMobile ? '8px' : '24px', position: 'relative' }}>
                    <div style={{ padding: isMobile ? 12 : 24, minHeight: 360, background: 'transparent' }}>
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
