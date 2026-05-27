import Cookies from "js-cookie";
import { addNotification } from "./notifications.action";
import { IOrder } from "../models/order.interface";
import { api } from "../../common/api";

export const ADD_ORDER: string = "ADD_ORDER";
export const EDIT_ORDER: string = "EDIT_ORDER";
export const REMOVE_ORDER: string = "REMOVE_ORDER";
export const SET_ORDERS: string = "SET_ORDERS";

const authHeaders = () => ({
    headers: {
        auth: Cookies.get('token') || ''
    }
});

export function loadOrders(): any {
    return async (dispatch: any) => {
        try {
            const response = await api.get('/order', authHeaders());
            if (Array.isArray(response.data) && response.data.length > 0) {
                return dispatch(setOrders(response.data));
            }
        } catch (e) {
            return dispatch(addNotification("Warning", "Using local order history"));
        }
    };
}

export function setOrders(orders: IOrder[]): ISetOrdersActionType {
    return { type: SET_ORDERS, orders: orders };
}

export function addOrder(order: IOrder): any {
    return async (dispatch: any) => {
        try {
            const response = await api.post('/order', {
                name: order.name,
                amount: order.amount,
                productId: order.product.id
            }, authHeaders());
            return dispatch({ type: ADD_ORDER, order: response.data });
        } catch (e) {
            dispatch(addNotification("Warning", "Order saved locally; API sync failed"));
            return dispatch({ type: ADD_ORDER, order: order });
        }
    };
}

export function editOrder(order: IOrder): any {
    return async (dispatch: any) => {
        try {
            const response = await api.patch('/order/' + order.id, {
                name: order.name,
                amount: order.amount,
                productId: order.product.id
            }, authHeaders());
            return dispatch({ type: EDIT_ORDER, order: response.data });
        } catch (e) {
            dispatch(addNotification("Warning", "Order edited locally; API sync failed"));
            return dispatch({ type: EDIT_ORDER, order: order });
        }
    };
}

export function removeOrder(id: number): any {
    return async (dispatch: any) => {
        try {
            await api.delete('/order/' + id, authHeaders());
        } catch (e) {
            dispatch(addNotification("Warning", "Order removed locally; API sync failed"));
        }
        return dispatch({ type: REMOVE_ORDER, id: id });
    };
}

interface IAddOrderActionType { type: string, order: IOrder };
interface ISetOrdersActionType { type: string, orders: IOrder[] };
