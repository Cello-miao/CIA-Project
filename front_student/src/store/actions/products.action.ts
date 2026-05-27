import Cookies from "js-cookie";
import { addNotification } from "./notifications.action";
import { IProduct, ProductModificationStatus } from "../models/product.interface";
import { api } from "../../common/api";
export const ADD_PRODUCT: string = "ADD_PRODUCT";
export const EDIT_PRODUCT: string = "EDIT_PRODUCT";
export const REMOVE_PRODUCT: string = "REMOVE_PRODUCT";
export const CHANGE_PRODUCT_AMOUNT: string = "CHANGE_PRODUCT_AMOUNT";
export const CHANGE_PRODUCT_PENDING_EDIT: string = "CHANGE_PRODUCT_PENDING_EDIT";
export const CLEAR_PRODUCT_PENDING_EDIT: string = "CLEAR_PRODUCT_PENDING_EDIT";
export const SET_MODIFICATION_STATE: string = "SET_MODIFICATION_STATE";
export const SET_PRODUCTS: string = "SET_PRODUCTS";

const authHeaders = () => ({
    headers: {
        auth: Cookies.get('token') || ''
    }
});

export function loadProducts(): any {
    return async (dispatch: any) => {
        try {
            const response = await api.get('/product', authHeaders());
            if (Array.isArray(response.data) && response.data.length > 0) {
                return dispatch(setProducts(response.data));
            }
        } catch (e) {
            return dispatch(addNotification("Warning", "Using local product inventory"));
        }
    };
}

export function setProducts(products: IProduct[]): ISetProductsActionType {
    return { type: SET_PRODUCTS, products: products };
}

export function addProduct(product: IProduct): any {
    return async (dispatch: any) => {
        try {
            const response = await api.post('/product', product, authHeaders());
            return dispatch({ type: ADD_PRODUCT, product: response.data });
        } catch (e) {
            dispatch(addNotification("Warning", "Product saved locally; API sync failed"));
            return dispatch({ type: ADD_PRODUCT, product: product });
        }
    };
}

export function editProduct(product: IProduct): any {
    return async (dispatch: any) => {
        try {
            const response = await api.patch('/product/' + product.id, product, authHeaders());
            return dispatch({ type: EDIT_PRODUCT, product: response.data });
        } catch (e) {
            dispatch(addNotification("Warning", "Product edited locally; API sync failed"));
            return dispatch({ type: EDIT_PRODUCT, product: product });
        }
    };
}

export function removeProduct(id: number): any {
    return async (dispatch: any) => {
        try {
            await api.delete('/product/' + id, authHeaders());
        } catch (e) {
            dispatch(addNotification("Warning", "Product removed locally; API sync failed"));
        }
        return dispatch({ type: REMOVE_PRODUCT, id: id });
    };
}

export function changeProductAmount(id: number, amount: number): IChangeProductAmountType {
    return { type: CHANGE_PRODUCT_AMOUNT, id: id, amount: amount };
}

export function changeSelectedProduct(product: IProduct): IChangeSelectedProductActionType {
    return { type: CHANGE_PRODUCT_PENDING_EDIT, product: product };
}

export function clearSelectedProduct(): IClearSelectedProductActionType {
    return { type: CLEAR_PRODUCT_PENDING_EDIT };
}

export function setModificationState(value: ProductModificationStatus): ISetModificationStateActionType {
    return { type: SET_MODIFICATION_STATE, value: value };
}

interface IAddProductActionType { type: string, product: IProduct };
interface IEditProductActionType { type: string, product: IProduct };
interface IRemoveProductActionType { type: string, id: number };
interface IChangeSelectedProductActionType { type: string, product: IProduct };
interface IClearSelectedProductActionType { type: string };
interface ISetModificationStateActionType { type: string, value:  ProductModificationStatus};
interface IChangeProductAmountType {type: string, id: number, amount: number};
interface ISetProductsActionType { type: string, products: IProduct[] };
