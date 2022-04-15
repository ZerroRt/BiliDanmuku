import Pako from 'pako';
import { BiliHTTPRequestResult, BiliHTTPRequestResult_CodeOk } from './BiliApiResponse.interface.d';
import { BiliDanmuContent, BiliPresentContent, DecodeSocketDataCallback, DecodeSocketDataResult, SocketDataDanmuData, SocketDataGiftData } from './BiliUtils.interface';

export class BiliUtils {
    static getRoomNumber(liveHref: string) {
        const url  = new URL(liveHref)

        return url.pathname.slice(1, url.pathname.length)
    }
    static stringToBytes(str: string) {
        const bytes = [];
        const len = str.length;

        for (let i = 0; i < len; i++) {
            const char = str.charCodeAt(i);
            if (char >= 0x010000 && char <= 0x10FFFF) {
                bytes.push(((char >> 18) & 0x07) | 0xF0)
                bytes.push(((char >> 12) & 0x3F) | 0x80)
                bytes.push(((char >> 6) & 0x3F) | 0x80)
                bytes.push((char & 0x3F) | 0x80)
            } else if (char >= 0x000800 && char <= 0x00FFFF) {
                bytes.push(((char >> 12) & 0x0F) | 0xE0)
                bytes.push(((char >> 6) & 0x3F) | 0x80)
                bytes.push((char & 0x3F) | 0x80)
            } else if (char >= 0x000080 && char <= 0x00007FF) {
                bytes.push(((char >> 6) & 0x1F) | 0xC0)
                bytes.push((char & 0x3F) | 0x80)
            } else {
                bytes.push(char & 0xFF)
            }
        }

        return bytes;
    }

    static getCertification(roomId: string) {
        const baseJsonData = {
            uid: 0,
            roomid: roomId,
            protover: 1,
            platform: 'web',
            clientver: '1.4.0'
        }
        const jsonString = JSON.stringify(baseJsonData)

        // convert jsonString to blob data
        const bytes = this.stringToBytes(jsonString);

        const headerLength = 16;
        const buffer = new ArrayBuffer(bytes.length + headerLength);
        const dataView = new DataView(buffer)

        // setHeaderInfo

        dataView.setUint32(0, bytes.length + 16); // set total length
        dataView.setUint16(4, 16); // header length
        dataView.setUint16(6, 1); // proto version
        dataView.setUint32(8, 7); // motion code
        dataView.setUint32(12, 1); // sequence = 1

        for (let i = 0; i < bytes.length; i++) {
            dataView.setUint8(headerLength + i, bytes[i]);
        }

        return dataView;
    }

    static getSocketPingBufferData() {
        const pingBuffer = new ArrayBuffer(16)
        const dataView = new DataView(pingBuffer);

        dataView.setUint32(0, 0);
        dataView.setUint16(4, 16);
        dataView.setUint16(6, 1);
        dataView.setUint32(8, 2);
        dataView.setUint32(12, 1);

        return dataView;
    }

    static transformRequestError(requestResult: BiliHTTPRequestResult) {
        if (requestResult.data !== BiliHTTPRequestResult_CodeOk) {
            if (requestResult.message || requestResult.msg) {
                return requestResult.message || requestResult.msg
            }
        }
    }

    static readInt(buffer: ArrayBuffer, start: number, length: number) {
        let result = 0;
        for (let i = length - 1; i >= 0; i--) {
            result += 256 ** (length - i - 1) * buffer[start + i]
        }

        return result;
    }

    static decodeSocketData(data: Blob, callback: DecodeSocketDataCallback) {
        const fr = new FileReader();
        fr.onload = (e) => {
            let buffer = new Uint8Array(e.target.result as ArrayBufferLike);

            const result:DecodeSocketDataResult = {
                packetLen: 0,
                headerLen: 0,
                ver: 0,
                op: 0,
                seq: 0,
                body: undefined,
            };

            result.packetLen = BiliUtils.readInt(buffer, 0, 4);
            result.headerLen = BiliUtils.readInt(buffer, 4, 2);
            result.ver = BiliUtils.readInt(buffer, 6, 2);
            result.op = BiliUtils.readInt(buffer, 8, 4);
            result.seq = BiliUtils.readInt(buffer, 12, 4);

            if (result.op === 5) {
                result.body = [];
                let offset = 0;

                const textDecoder = new TextDecoder();
                while (offset < buffer.length) {
                    const packetLen = BiliUtils.readInt(buffer, offset + 0, 4);
                    const headerLen = 16;
                    const data = buffer.slice(offset + headerLen, offset + packetLen);
                    let body;

                    if (result.ver === 2) {
                        // if proto version is 2, data has been ziped, need to unzip by pako
                        body = textDecoder.decode(Pako.inflate(data))
                    } else {
                        body = textDecoder.decode(data);
                    }

                    if (body) {
                        // split all messages in data
                        const groups = body.split(/[\x00-\x1f]+/);

                        groups.forEach(group => {
                            try {
                                result.body.push(JSON.parse(group))
                            } catch (error) {
                                
                            }
                        })
                    }

                    offset += packetLen;
                }
            }

            callback(result)
        }
        fr.readAsArrayBuffer(data)
    }

    static getDanmuData(socketDanmu: SocketDataDanmuData):BiliDanmuContent {
        const { info } = socketDanmu;
        const [_, danmuInfo, [userId, userName]] = info;

        return {
            content: danmuInfo,
            user: {
                id: userId,
                name: userName,
            }
        }
    }

    static getPresentData(socketPresent: SocketDataGiftData):BiliPresentContent {
        const { action, giftName, uid, uname, num } = socketPresent.data;
        return {
            giftAction: action,
            giftName,
            giftNumber: num,
            user: {
                id: uid,
                name: uname
            }
        }
    }
}