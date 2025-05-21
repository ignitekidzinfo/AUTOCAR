import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { StyledEngineProvider } from '@mui/material/styles';
import { NotificationProvider } from './components/common/Notification';
import { SidebarProvider } from './contexts/SidebarContext';
import MainRoutes from './MainRoutes';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <SidebarProvider>
      <StyledEngineProvider injectFirst>
        <BrowserRouter>
          <NotificationProvider>
            <MainRoutes />
          </NotificationProvider>
        </BrowserRouter>
      </StyledEngineProvider>
    </SidebarProvider>
  </React.StrictMode>
);

