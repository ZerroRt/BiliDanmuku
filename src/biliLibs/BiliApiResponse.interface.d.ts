export const BiliHTTPRequestResult_CodeOk = 0

export type BiliHTTPRequestResult<T = any> = {
    code: number,
    data: T,
    message: string,
    msg: string,
}

export interface GetRoomIdResponse {
    room_id: string; // 真正的roomId
    short_id: string;
    uid: string;
}

export interface BiliHostServerList {
    host: string,
    port: number,
    wss_port: number,
    ws_port: number,
}

export interface GetWebSocketPathResonse {
    refresh_row_factor: number;
    refresh_rate: number,
    max_delay: number,
    port: number,
    host: string,
    host_server_list: Array<BiliHostServerList>
}