import { Status } from "./status";

export interface RequestStatus {
    id:string;
    status:Status,
    result?:any
}
