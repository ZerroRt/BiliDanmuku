export enum BiliTcpCommand {
    getDanmu = 'DANMU_MSG',
    sendGift = 'SEND_GIFT',
    joinRoom = 'WELCOME',
    sysMessage = 'SYS_MSG',
    liveStart = 'LIVE',
}

export interface SocketDataBodyBase {
    cmd: BiliTcpCommand,
}

export interface SocketDataDanmuData extends SocketDataBodyBase {
    cmd: BiliTcpCommand.getDanmu,
    info: [
        Array<any>,
        string,
        [
            number,
            string,
        ]
    ]
}

export interface SocketDataGiftData extends SocketDataBodyBase {
    cmd: BiliTcpCommand.sendGift,
    data: {
        uname: string,
        uid: number,

        action: string,
        giftName: string,
        giftType: number,
        num: number,
    }
}

export interface DecodeSocketDataResult {
    packetLen: number,
    headerLen: number,
    ver: number,
    op: number,
    seq: number,
    body: Array<SocketDataBodyBase | number | string>
}

export type DecodeSocketDataCallback = (
    result: DecodeSocketDataResult
) => void;

export interface BiliLiveMotionBase {
    user: {
        id: number,
        name: string,
    }
}

export interface BiliDanmuBulgeContent {
    bulge_display: number, // should display bulge
    emoticon_unique: string, // sticker unique id: room_roomid_count
    in_player_area: number,
    is_dynamic: number,

    url: string,
    height: number,
    width: number,
}

export interface BiliDanmuContent extends BiliLiveMotionBase {
    content: string,
    bulgeContent?: BiliDanmuBulgeContent
}

export interface BiliPresentContent extends BiliLiveMotionBase {
    giftAction: string,
    giftName: string,
    giftNumber: number,
}