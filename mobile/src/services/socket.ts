import io from 'socket.io-client';

const socket = io('http://192.168.3.110:3000', {
    autoConnect: false,
});

export default socket;
