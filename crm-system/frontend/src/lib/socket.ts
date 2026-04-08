import { io } from "socket.io-client";

// Set to your backend URL
const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/api$/, "");

export const socket = io(SOCKET_URL);
