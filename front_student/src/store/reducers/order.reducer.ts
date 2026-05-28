import { IOrdersState, IActionBase } from "../models/root.interface";
import { ADD_ORDER, SET_ORDERS, EDIT_ORDER, REMOVE_ORDER } from "../actions/orders.actions";


const initialState: IOrdersState = {
    orders: []
};

function orderReducer(state: IOrdersState = initialState, action: IActionBase): IOrdersState {
    switch (action.type) {
        case ADD_ORDER: {
            let maxId: number = Math.max.apply(Math, state.orders.map((o) => { return o.id; }));
            if(maxId === -Infinity) { maxId = 0; }
            return {...state, orders: [...state.orders, {...action.order, id: maxId + 1}]};
        }
        case EDIT_ORDER: {
            const foundIndex: number = state.orders.findIndex(or => or.id === action.order.id);
            let orders = state.orders;
            orders[foundIndex] = action.order;
            return { ...state, orders: orders };
        }
        case REMOVE_ORDER: {
            return { ...state, orders: state.orders.filter(or => or.id !== action.id) };
        }
        case SET_ORDERS: {
            return { ...state, orders: action.orders };
        }
        default:
            return state;
    }
}


export default orderReducer;