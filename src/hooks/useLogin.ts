import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../context/AuthContext';
import { SignInUser } from '../Services/userService';
import { loginSchema, LoginFormData } from '../schemas/authSchemas';
import logger from '../utils/logger';

interface MyJwtPayload {
    authorities: string[];
    roles: string[];
    firstname: string;
    componentNames: string[];
    exp?: number;
}

export const useLogin = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: 'onBlur',
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            const response = await SignInUser({
                username: data.email,
                password: data.password,
            });

            if (!response) {
                throw new Error('No response received from server');
            }

            const decodedToken = jwtDecode<MyJwtPayload>(response);

            const expTime = decodedToken.exp ? Number(decodedToken.exp) * 1000 : 0;
            const currentTime = Date.now();

            if (!decodedToken.exp || expTime <= currentTime) {
                toast.error('Session token is expired. Please sign in again.');
                return;
            }

            login(response);
            toast.success('Signed in successfully!');

            // Small delay to ensure state updates before navigation
            setTimeout(() => {
                navigate('/');
            }, 500);

        } catch (error: any) {
            logger.error('Sign-in failed', error);

            let errorMessage = 'An unexpected error occurred. Please try again.';

            if (error.response) {
                errorMessage = error.response.data?.message ||
                    error.response.data?.error ||
                    'Invalid email or password';
            } else if (error.request) {
                errorMessage = 'Server is not responding. Please check if the server is running.';
            } else if (error.message && error.message.includes('ERR_CONNECTION_REFUSED')) {
                errorMessage = 'Unable to connect to the server. Please check if the server is running.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        register,
        handleSubmit: handleSubmit(onSubmit),
        errors,
        isLoading,
    };
};
