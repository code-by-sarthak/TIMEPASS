export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN';

export interface User {
  id: string;
  email?: string | null;
  phone?: string | null;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isGuest: boolean;
  role: UserRole;
  isBanned: boolean;
  bannedUntil?: string | null;
  banReason?: string | null;
  createdAt: string;
  profile?: UserProfile | null;
}

export interface UserProfile {
  id: string;
  userId: string;
  bio?: string | null;
  country: string;
  languages: string; // Comma-separated or string list
  interests: string; // Comma-separated or string list
  ageConfirmed: boolean;
  preferredChatMode: 'video' | 'text';
  allowFriendRequests: boolean;
  theme: 'dark' | 'light';
}

export interface MatchPartner {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  country: string;
  interests: string[];
  languages: string[];
  sharedInterests: string[];
}

export type CallState = 
  | 'idle' 
  | 'permission_requested'
  | 'permission_denied'
  | 'searching' 
  | 'match_found' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'disconnected'
  | 'ended' 
  | 'error';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  isSelf: boolean;
  content: string;
  timestamp: string;
}

export interface ReportPayload {
  reportedUserId: string;
  reason: string;
  details?: string;
  conversationId?: string;
}

export interface AdminStats {
  activeOnline: number;
  activeVideoCalls: number;
  activeTextChats: number;
  queueVideo: number;
  queueText: number;
  totalUsers: number;
  totalReports: number;
  pendingReports: number;
  bannedUsers: number;
}

export interface ReportItem {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reporterName: string;
  reportedUserName: string;
  reportedUserEmail?: string | null;
  reportedUserBanned?: boolean;
  reason: string;
  details?: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  actionTaken?: string;
  adminNotes?: string;
  createdAt: string;
}

export interface QueuedUser {
  socketId: string;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  mode: 'video' | 'text';
  interests: string[];
  languages: string[];
  country: string;
  joinedAt: number;
  previousPartnerId?: string;
  blockedUserIds: string[];
}

export interface ActiveRoom {
  roomId: string;
  mode: 'video' | 'text';
  user1: { socketId: string; userId: string; displayName: string };
  user2: { socketId: string; userId: string; displayName: string };
  startedAt: number;
}
