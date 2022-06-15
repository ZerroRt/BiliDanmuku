import { BiliUtils } from './biliLibs/BiliUtils';
import { BiliDanmuContent, BiliPresentContent, BiliTcpCommand } from './biliLibs/BiliUtils.interface.d';
import { SocketModule } from './networks/socket'
const onDanmu = (
    _,
    payload: BiliDanmuContent
) => {
    const { bulgeContent, user, content } = payload;

    if (bulgeContent) {
        console.log('%c', `background: url('${bulgeContent.url}')`)
    } else {
        console.log(`${user.name}: ${content}`)
    }
}

const onPresent = (
    _,
    payload: BiliPresentContent
) => {
    console.log(`${payload.user.name} ${payload.giftAction} ${payload.giftName}X${payload.giftNumber}`)
}

const onSticker = () => {}


const start = () => {

    // set live room address
    const liveRoomHref = 'https://live.bilibili.com/23945753'

    const roomNumber = BiliUtils.getRoomNumber(liveRoomHref);

    const socket = new SocketModule(roomNumber);

    socket.on(BiliTcpCommand.getDanmu, onDanmu);
    socket.on(BiliTcpCommand.sendGift, onPresent);

    socket.connect();
}

start();