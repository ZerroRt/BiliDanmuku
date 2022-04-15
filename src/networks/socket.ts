import axios from 'axios';
import { EventListenerCallback } from './socket.interface';
import { roomApiGetPath, wsHostGetPath } from '../biliLibs/BILIAPI_CONFIG';
import {
    BiliHTTPRequestResult, BiliHTTPRequestResult_CodeOk,
    GetRoomIdResponse,
    GetWebSocketPathResonse,
} from '../biliLibs/BiliApiResponse.interface.d';
import { BiliUtils } from '../biliLibs/BiliUtils';
import { BiliTcpCommand, DecodeSocketDataResult, SocketDataDanmuData, SocketDataGiftData } from '../biliLibs/BiliUtils.interface.d';

export class SocketModule {
    roomId = ''

    private _socket:WebSocket = undefined;

    private _pingIntervalTimer = 0;

    eventMaps = new Map<string, Array<EventListenerCallback>>();

    constructor(roomId: string) {
        this.roomId = roomId
    }

    private async _getRoomId() {
        if (this.roomId) {
            const requestApi = new URL(roomApiGetPath, location.origin)
            requestApi.searchParams.set('id', `${this.roomId}`)

            const requestResult = await axios.get<BiliHTTPRequestResult<GetRoomIdResponse>>(requestApi.href)
            const { data } = requestResult;
            if (data.code === BiliHTTPRequestResult_CodeOk) {
                const { room_id } = data.data
                return room_id
            } else {
                throw new Error(BiliUtils.transformRequestError(data))
            }
        }
    }

    private async  _getWebSocketInfo(roomId: string) {
        const platform = 'pc';
        const player = 'web';

        const requestApi = new URL(wsHostGetPath, location.origin);
        requestApi.searchParams.set('platform', platform);
        requestApi.searchParams.set('player', player);
        requestApi.searchParams.set('room_id', roomId);

        const requestResult = await axios.get<BiliHTTPRequestResult<GetWebSocketPathResonse>>(requestApi.href)

        const { data } = requestResult;
        if (data.code === BiliHTTPRequestResult_CodeOk) {
            const { port, host } = data.data;

            return { port, host }
        } else {
            throw new Error(BiliUtils.transformRequestError(data))
        }
    }

    private _intervalPingSend() {
        clearInterval(this._pingIntervalTimer)
        this._pingIntervalTimer = window.setInterval(() => {
            if (this._socket && this._socket.readyState === WebSocket.OPEN) {
                const pingData = BiliUtils.getSocketPingBufferData();
                this._socket.send(pingData.buffer)
                return;
            }

            clearInterval(this._pingIntervalTimer);
        }, 30 * 1000)
    }

    private handleTCPCmd(tcpResult: DecodeSocketDataResult) {
        const { body } = tcpResult;

        if (body) {
            body.forEach(command => {
                if (typeof command === 'object') {
                    let processData;
                    switch (command.cmd) {
                        case BiliTcpCommand.getDanmu:
                            processData = BiliUtils.getDanmuData((command as SocketDataDanmuData))
                            break;
                        case BiliTcpCommand.sendGift:
                            processData = BiliUtils.getPresentData((command as SocketDataGiftData))
                        default:
                            break;
                    }
    
                    if (processData) {
                        if (this.eventMaps.has(command.cmd)) {
                            this.eventMaps.get(command.cmd).forEach(cb => cb(command.cmd, processData))
                        }  
                    }
                }
            })
        }
    }

    private handleMessageArrived(evData: MessageEvent) {
        const { data } = evData;
        BiliUtils.decodeSocketData(data, this.handleTCPCmd.bind(this))
    }

    private _startListen() {
        if (this._socket) {
            this._socket.onopen = () => {
                const certification = BiliUtils.getCertification(this.roomId);
                this._socket.send(certification.buffer);
                this._intervalPingSend();
            }

            this._socket.onmessage = this.handleMessageArrived.bind(this);
        }
    }

    // connect socket
    async connect() {
        window.clearInterval(this._pingIntervalTimer);

        // need get true room_id first
        const roomId = await this._getRoomId();
        this.roomId = roomId;
        const webSocketInfo = await this._getWebSocketInfo(roomId);

        const tcpAddress = `wss://${webSocketInfo.host}/sub`;

        this._socket = new WebSocket(tcpAddress);

        this._startListen();
    }

    // io set listener
    on(eventName: BiliTcpCommand, callback: EventListenerCallback) {
        if (this.eventMaps.has(eventName)) {
            const storedCallbacks = this.eventMaps.get(eventName)
            if (!storedCallbacks.find((cb) => cb === callback)) {
                storedCallbacks.push(callback);
            }
        } else {
            this.eventMaps.set(eventName, [callback]);
        }
    }

    off(eventName: BiliTcpCommand, callback?: EventListenerCallback) {
        const storedCallbacks = this.eventMaps.get(eventName);

        if (storedCallbacks) {
            if (callback) {
                const findIndex = storedCallbacks.findIndex((cb) => cb === callback)
                if (findIndex !== -1) {
                    storedCallbacks.splice(findIndex, 1);
                    this.eventMaps.set(eventName, storedCallbacks);
                }
            } else {
                this.eventMaps.delete(eventName)
            }
        }
    }

    distroy() {
        this.eventMaps.clear();
        window.clearInterval(this._pingIntervalTimer);
    }
}