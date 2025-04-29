import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { StyledEngineProvider } from '@mui/material/styles';
import { NotificationProvider } from './components/common/Notification';
import { SidebarProvider } from './contexts/SidebarContext';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <SidebarProvider>
      <StyledEngineProvider injectFirst>
        <BrowserRouter>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </BrowserRouter>
      </StyledEngineProvider>
    </SidebarProvider>
  </React.StrictMode>
);

