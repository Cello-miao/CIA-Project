import { IUser } from "../models/user.interface";
import Cookies from "js-cookie";
import { api } from "../../common/api";
export const ADD_ADMIN: string = "ADD_ADMIN";
export const GET_USERS: string = "GET_USERS";
export const REMOVE_ADMIN: string = "REMOVE_ADMIN";


export function addAdmin(user: IUser): any {
    return async (dispatch : any) => {
        try {
            await api.patch('/user/' + user.id, {
                username: user.username, role : "ADMIN"
            },{
                headers: {
                    auth: Cookies.get('token') || ''
                }
            });
            return dispatch({ type: ADD_ADMIN, user: user });
        } catch (e) {
            // Keep local UI stable even if the API request fails.
        }
    }
}

export function removeAdmin(user: IUser): (dispatch: any) => Promise<any> {
    return async (dispatch : any) => {
        try {
            await api.patch('/user/' + user.id, {
                username: user.username, role : "NORMAL"
            },{
                headers: {
                    auth: Cookies.get('token') || ''
                }
            });
            return dispatch({ type: REMOVE_ADMIN, user: user });
        } catch (e) {
            // Keep local UI stable even if the API request fails.
        }
    }
}
export function getUsers(): any {

    return async (dispatch : any) => {
        try {
            const response = await api.get('/user', {
                headers: {
                    auth: Cookies.get('token') || ''
                }
            });
            const tmpUsers : IUser[] = response.data;
            let users : IUser[] = [];
            let admins : IUser[] = [];
            tmpUsers.forEach((user : IUser) => {
                if (user.role === "ADMIN") {
                    admins.push(user);
                }
                else {
                    users.push(user);
                }
            })
            return dispatch({type: GET_USERS, admins, users});
        } catch (e) {
            // Keep local UI stable even if the API request fails.
        }
    }
}
