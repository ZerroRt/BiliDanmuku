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
    const socket = new SocketModule('213');

    socket.on(BiliTcpCommand.getDanmu, onDanmu);
    socket.on(BiliTcpCommand.sendGift, onPresent);

    socket.connect();
}

start();