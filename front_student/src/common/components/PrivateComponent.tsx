import { Navigate } from "react-router-dom";
import React from "react";
import Cookies from 'js-cookie';

interface PrivateComponentProps {
  children: React.ReactNode;
}

export function PrivateComponent({ children }: PrivateComponentProps): JSX.Element {
    const token = Cookies.get("token");
    const isAuthenticated = !!token;
    
    return (
        isAuthenticated ? <>{children}</> : <Navigate to="/login" />
    );
}