import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { StyledEngineProvider } from '@mui/material/styles';
import { NotificationProvider } from './components/common/Notification';
import { SidebarProvider } from './contexts/SidebarContext';
import { AuthProvider } from './context/AuthContext';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <BrowserRouter>
        <AuthProvider>
          <SidebarProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </SidebarProvider>
        </AuthProvider>
      </BrowserRouter>
    </StyledEngineProvider>
  </React.StrictMode>
);

