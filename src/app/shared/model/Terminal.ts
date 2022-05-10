// Note:
// Payload format for bidirectional WebSocket(WS) communication
export interface ITerminalFrame {
  Op: string;
  Data?: string;
  SessionID?: string;
  Rows?: number;
  Cols?: number;
}
