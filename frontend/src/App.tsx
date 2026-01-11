import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TimetableView from './pages/TimetableView';
import ManageDepartments from './pages/ManageDepartments';
import ManageRooms from './pages/ManageRooms';
import ManagePrograms from './pages/ManagePrograms';
import ManageModules from './pages/ManageModules';
import ManageUsers from './pages/ManageUsers';
import ManageExams from './pages/ManageExams';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="timetable" element={<TimetableView />} />
          <Route path="manage/departments" element={<ManageDepartments />} />
          <Route path="manage/rooms" element={<ManageRooms />} />
          <Route path="manage/programs" element={<ManagePrograms />} />
          <Route path="manage/modules" element={<ManageModules />} />
          <Route path="manage/users" element={<ManageUsers />} />
          <Route path="manage/exams" element={<ManageExams />} />
          <Route path="settings" element={<div>Settings Page</div>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
