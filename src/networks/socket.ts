import io from 'socket.io';
import axios from 'axios';
import { EventListenerCallback } from './socket.interface';
import { roomApiGetPath } from '../biliLibs/BILIAPI_CONFIG';
import { GetRoomIdResponse } from '../biliLibs/BiliApiResponse.interface';

export class SocketModule {
    roomId = 0

    eventMaps = new Map<string, Array<EventListenerCallback>>();

    constructor(roomId) {
        this.roomId = roomId
    }

    async _getRoomId() {
        if (this.roomId) {
            const requestApi = new URL(roomApiGetPath)
            requestApi.searchParams.set('id', `${this.roomId}`)

            const requestResult = await axios.get<GetRoomIdResponse>(requestApi.href)
            console.log(requestResult)
        }
    }

    // connect socket
    async connect() {
        await this._getRoomId();
    }

    // io set listener
    on(eventName: string, callback: EventListenerCallback) {
        if (this.eventMaps.has(eventName)) {
            const storedCallbacks = this.eventMaps.get(eventName)
            if (!storedCallbacks.find((cb) => cb === callback)) {
                storedCallbacks.push(callback);
            }
        } else {
            this.eventMaps.set(eventName, [callback]);
        }
    }

    off(eventName: string, callback?: EventListenerCallback) {
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
}