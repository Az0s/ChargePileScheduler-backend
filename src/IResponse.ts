import { Response } from "express";
export interface IResponse extends Response {
    json(input: ResponseData);
}

export interface ResponseData {
    code: number;
    message: string;
    data?: Object;
}

export interface LoginData{
    token: string;
    is_admin: Boolean;
}
export interface chargingPileData { 
    chargingPileId: string;
}