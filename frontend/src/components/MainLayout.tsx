import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Avatar } from 'antd';
import { UserOutlined, LogoutOutlined, CalendarOutlined, DashboardOutlined, SettingOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState<any>(null);

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



    const getMenuItems = () => {
        if (!user) return [];

        const items = [
            { key: '/', icon: <DashboardOutlined />, label: 'Dashboard', onClick: () => navigate('/') },
            { key: '/timetable', icon: <CalendarOutlined />, label: 'Timetable', onClick: () => navigate('/timetable') },
        ];

        if (user.role === 'admin') {
            items.push(
                { key: '/manage/departments', icon: <SettingOutlined />, label: 'Departments', onClick: () => navigate('/manage/departments') },
                { key: '/manage/rooms', icon: <SettingOutlined />, label: 'Rooms', onClick: () => navigate('/manage/rooms') },
                { key: '/manage/programs', icon: <SettingOutlined />, label: 'Programs', onClick: () => navigate('/manage/programs') },
                { key: '/manage/modules', icon: <SettingOutlined />, label: 'Modules', onClick: () => navigate('/manage/modules') },
                { key: '/manage/users', icon: <SettingOutlined />, label: 'Users', onClick: () => navigate('/manage/users') },
                { key: '/manage/exams', icon: <SettingOutlined />, label: 'Exams', onClick: () => navigate('/manage/exams') },
            );
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
                <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: 16 }}>
                        <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
                        <span style={{ fontWeight: 500 }}>{user?.full_name || 'Loading...'}</span>
                    </div>
                    <Button
                        type="text"
                        icon={<LogoutOutlined />}
                        onClick={handleLogout}
                        danger
                    >
                        Logout
                    </Button>
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
