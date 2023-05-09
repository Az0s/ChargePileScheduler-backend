import { Response } from "express";
export interface IResponse<T> extends Response {
    json(input: ResponseData<T>);
}

export interface ResponseData<T> {
    code: number;
    message: string;
    data?: T;
}

export interface LoginData {
    token: string;
    is_admin: Boolean;
}
export interface chargingPileData {
    chargingPileId: string;
}
