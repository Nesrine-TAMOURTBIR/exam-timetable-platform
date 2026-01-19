import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Avatar } from 'antd';
import { UserOutlined, LogoutOutlined, CalendarOutlined, DashboardOutlined, SettingOutlined, MenuOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [collapsed, setCollapsed] = useState(window.innerWidth < 768);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) setCollapsed(true);
        };
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

        if (user.role === 'admin' || user.role === 'head') {
            const mgmtItems = [];
            if (user.role === 'admin') {
                mgmtItems.push({ key: '/manage/departments', label: 'Départements', onClick: () => navigate('/manage/departments') });
                mgmtItems.push({ key: '/manage/rooms', label: 'Salles', onClick: () => navigate('/manage/rooms') });
            }
            mgmtItems.push({ key: '/manage/programs', label: 'Formations', onClick: () => navigate('/manage/programs') });
            mgmtItems.push({ key: '/manage/modules', label: 'Modules', onClick: () => navigate('/manage/modules') });
            if (user.role === 'admin') {
                mgmtItems.push({ key: '/manage/users', label: 'Utilisateurs', onClick: () => navigate('/manage/users') });
            }
            mgmtItems.push({ key: '/manage/exams', label: 'Examens', onClick: () => navigate('/manage/exams') });

            items.push({
                key: '/settings-group',
                icon: <SettingOutlined />,
                label: 'Gestion',
                children: mgmtItems
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
            {/* Animated Background Blobs */}
            <div className="tech-bg-anim">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            <div
                className={`mobile-overlay ${isMobile && !collapsed ? 'active' : ''}`}
                onClick={() => setCollapsed(true)}
            />

            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                trigger={null}
                width={260}
                collapsedWidth={isMobile ? 0 : 80}
                className={`ant-layout-sider ${isMobile && collapsed ? 'sider-mobile-hidden' : ''}`}
            >
                <div style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    position: 'relative'
                }}>
                    {/* Top Section with Branding & Trigger */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'space-between',
                        marginBottom: 24,
                        paddingBottom: 16,
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        {!collapsed && (
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', letterSpacing: '2px' }}>EXAMIFY</div>
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>V1.0 TECH</div>
                            </div>
                        )}
                        <Button
                            type="text"
                            icon={collapsed ? <MenuOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{ color: '#fff' }}
                        />
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                        <Menu
                            theme="dark"
                            mode="inline"
                            selectedKeys={[location.pathname]}
                            items={getMenuItems()}
                            style={{ background: 'transparent', border: 'none' }}
                        />
                    </div>

                    {!collapsed && (
                        <div style={{
                            paddingTop: 16,
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            textAlign: 'center',
                            opacity: 0.4,
                            fontSize: '10px'
                        }}>
                            University Portal v1.0
                        </div>
                    )}
                </div>
            </Sider>

            <Layout className={`layout-content-offset ${collapsed ? 'collapsed' : ''}`} style={{ background: 'transparent' }}>
                <Header style={{
                    left: isMobile ? 0 : (collapsed ? '80px' : '260px'),
                    width: isMobile ? '100%' : `calc(100% - ${collapsed ? '80px' : '260px'})`,
                    padding: isMobile ? '8px 16px 0 16px' : '8px 24px 0 24px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '12px' : '0'
                    }}>
                        {isMobile && (
                            <Button
                                type="text"
                                icon={collapsed ? <MenuOutlined /> : <MenuFoldOutlined />}
                                onClick={() => setCollapsed(!collapsed)}
                                style={{ color: '#fff', fontSize: '20px' }}
                            />
                        )}
                        <div style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 600, color: '#fff' }}>
                            Portal <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>| {user?.role?.replace('_', ' ').toUpperCase()}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        {!isMobile && (
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <span style={{ fontSize: '13px', color: '#fff', lineHeight: 1.2, fontWeight: 500 }}>{user?.full_name}</span>
                                <span style={{ fontSize: '10px', color: 'var(--tech-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px', fontWeight: 700 }}>
                                    ● Connecté
                                </span>
                            </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Avatar
                                size={isMobile ? "small" : "default"}
                                icon={<UserOutlined />}
                                style={{
                                    backgroundColor: themeColor,
                                    boxShadow: `0 0 15px ${themeColor}66`,
                                    border: '1px solid rgba(255,255,255,0.2)'
                                }}
                            />
                            <Button
                                type="text"
                                icon={<LogoutOutlined />}
                                onClick={handleLogout}
                                className="logout-btn"
                                style={{ color: 'rgba(255,255,255,0.4)', fontSize: '18px' }}
                            />
                        </div>
                    </div>
                </Header>

                <Content style={{
                    padding: isMobile ? '8px' : '32px',
                    minHeight: 'calc(100vh - var(--header-height))',
                    background: 'transparent'
                }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
