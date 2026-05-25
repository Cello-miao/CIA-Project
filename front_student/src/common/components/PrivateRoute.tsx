import { Route, RouteProps, Navigate } from "react-router-dom";
import React from "react";
import { useSelector } from "react-redux";
import { IStateType } from "../../store/models/root.interface";


export function PrivateRoute({ children, ...rest }: any): JSX.Element {
    const isAuthenticated = useSelector((state: IStateType) => state.account.isAuthenticated);
    
    return (
        <Route
            {...rest}
            element={isAuthenticated ? children : <Navigate to="/login" replace />}
        />
    );
}