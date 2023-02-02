import {
  getRoomListOutput,
  postGameStartToRoom,
  postRoomDisconnect,
  postChatWithRoom,
  sendGameStartToRoom,
  sendRoomDisconnect,
  sendChatWithRoom,
  sendHasteToRoom,
  sendGatherToRoom,
} from '../../../integration/routebacks';
import { ServerError, ServerResponse } from './../../../integration/roomlist';

const serverPath = 'http://localhost:4209';

const fetchFromServer = async (path: string, init: RequestInit) => {
  return await fetch(`${serverPath}${path}`, init);
};

const getRoomList = async (): Promise<ServerResponse> => {
  const result = await fetchFromServer('/getRoomList', {
    method: 'GET',
    credentials: 'include',
  }).catch((e: Error) => {
    console.error('Could not load room list!');
    throw {
      message: `Couldn't load room list`,
      response: `${e.message}`,
      status: result.status,
    } as ServerError;
  });
  if (result.status === 200) {
    return {
      response: {
        data: (await result.json()) as getRoomListOutput,
        status: 200,
      },
    };
  } else {
    throw {
      message: `Couldn't load room list`,
      response: await result.text(),
      status: result.status,
    } as ServerError;
  }
};

const connectToRoom = (roomid: number, playerid: string): EventSource => {
  const result = new EventSource(
    `${serverPath}/room/${roomid}/connect/${playerid}`
  );
  return result;
};

const disconnectFromRoom = async (
  roomid: number,
  playerid: string
): Promise<ServerResponse> => {
  console.log('Disconnect from server');
  const result = await fetchFromServer(`/room/${roomid}/disconnect`, {
    method: 'POST',
    body: JSON.stringify({ playerid } as sendRoomDisconnect),
  });
  return {
    response: {
      data: (await result.text()) as postRoomDisconnect,
      status: result.status,
    },
  };
};

const chatWithRoom = async (roomid: number, playerid: string, msg: string) => {
  console.log('Sending message:', { roomid, playerid, msg });
  const result = await fetchFromServer(`/room/${roomid}/chat`, {
    method: 'POST',
    body: JSON.stringify({ playerid, msg } as sendChatWithRoom),
  });
  return {
    response: {
      data: (await result.text()) as postChatWithRoom,
      status: result.status,
    },
  };
};

const sendAnswersToServer = async (
  roomid: number,
  playerid: string,
  answers: Map<number, string>
) => {
  console.log('Sending answers');
  const answersArray = [...answers];
  const result = await fetchFromServer(`/room/${roomid}/data`, {
    method: 'POST',
    body: JSON.stringify({ playerid, data: answersArray } as sendGatherToRoom),
  });
};

const sendHasteSignalToServer = async (roomid: number, playerid: string) => {
  console.log('Haste');
  const result = await fetchFromServer(`/room/${roomid}/haste`, {
    method: 'POST',
    body: JSON.stringify({ playerid } as sendHasteToRoom),
  });
};

const sendGameStartSignal = async (roomid: number, playerid: string) => {
  console.log('Sending start event');
  const result = await fetchFromServer(`/room/${roomid}/start`, {
    method: 'POST',
    body: JSON.stringify({ playerid } as sendGameStartToRoom),
  });
  return {
    response: {
      data: (await result.text()) as postGameStartToRoom,
      status: result.status,
    },
  };
};

const Server = {
  getRoomList,
  disconnectFromRoom,
  connectToRoom,
  chatWithRoom,
  sendAnswersToServer,
  sendHasteSignalToServer,
  sendGameStartSignal,
};

export default Server;
