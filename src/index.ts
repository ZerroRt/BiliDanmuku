import { BiliUtils } from './biliLibs/BiliUtils';
import { BiliDanmuContent, BiliPresentContent, BiliTcpCommand } from './biliLibs/BiliUtils.interface.d';
import { SocketModule } from './networks/socket'
const onDanmu = (
    _,
    payload: BiliDanmuContent
) => {
    console.log(`${payload.user.name}: ${payload.content}`)
}

const onPresent = (
    _,
    payload: BiliPresentContent
) => {
    console.log(`${payload.user.name} ${payload.giftAction} ${payload.giftName}X${payload.giftNumber}`)
}


const start = () => {

    // set live room address
    const liveRoomHref = 'https://live.bilibili.com/213?broadcast_type=0'

    const roomNumber = BiliUtils.getRoomNumber(liveRoomHref);

    const socket = new SocketModule(roomNumber);

    socket.on(BiliTcpCommand.getDanmu, onDanmu);
    socket.on(BiliTcpCommand.sendGift, onPresent);

    socket.connect();
}

start();