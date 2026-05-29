import Cookies from "js-cookie";
import {addNotification} from "./notifications.action";
import {api} from "../../common/api";

export const LOG_IN: string = "LOG_IN";
export const REGISTER: string = "REGISTER";
export const LOG_OUT: string = "LOG_OUT";

export function me(): any {

    return async (dispatch : any) => {
        try {
            const response = await api.get('/auth/me', {
                headers: {
                    auth: Cookies.get('token') || ''
                }
            });
            return dispatch({type: LOG_IN, email: response.data.username});
        } catch (e) {
            if (e.response === undefined) {
                return dispatch(addNotification("Error", e.message));
            }
            return dispatch(addNotification("Error", "Session expired"));
        }
    }
}


export function login(email: string, password: string): any {

    return async (dispatch : any) => {
        try {
            const response = await api.post('/auth/login', {
                username: email,
                password: password
            });
            Cookies.set('token', response.data.token, { sameSite: 'strict' });
            return dispatch({type: LOG_IN, email: email});
        } catch (e) {
            if (e.response === undefined) {
                return dispatch(addNotification("Error", e.message));
            }
            return dispatch(addNotification("Error", e.response.data));
        }
    }
}

export function register(email: string, password: string): any {

    return async (dispatch : any) => {
        try {
            const response = await api.post('/auth/register', {
                username: email,
                password: password
            });

            dispatch(addNotification("Success", response.data));
            return dispatch({type: REGISTER});
        } catch (e) {
            if (e.response === undefined) {
                return dispatch(addNotification("Error", e.message));
            }
            // Handle new object format {message: "..."}
            if (e.response.data.message !== undefined) {
                return dispatch(addNotification("Error", e.response.data.message));
            }
            // Handle old array format
            if (e.response.data.length !== undefined) {
                return dispatch(addNotification("Error", e.response.data[0].constraints.length));
            }
            return dispatch(addNotification("Error", e.response.data));
        }
    }
}

export function logout(): ILogOutActionType {
    return { type: LOG_OUT};
}

interface ILogInActionType { type: string, email: string };
interface ILogOutActionType { type: string };
