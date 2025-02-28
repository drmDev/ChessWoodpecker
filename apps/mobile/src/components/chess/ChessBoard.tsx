import { Platform } from 'react-native';
import { WebChessBoard } from './web/ChessBoard';
import { MobileChessBoard } from './mobile/ChessBoard';

export const ChessBoard = Platform.select({
  web: WebChessBoard,
  default: MobileChessBoard,
}); 