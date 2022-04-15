import { BiliLiveMotionBase, BiliTcpCommand } from '../biliLibs/BiliUtils.interface.d';

export type EventListenerCallback = (
    triggerBy: BiliTcpCommand,
    payload: any
) => void