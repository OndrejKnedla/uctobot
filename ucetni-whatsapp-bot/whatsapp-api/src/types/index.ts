export enum TrustLevel {
  NEW_USER = 'NEW_USER',
  REGULAR = 'REGULAR',
  VERIFIED = 'VERIFIED',
  PREMIUM = 'PREMIUM'
}

export interface TrustLimits {
  weeklyMax: number;
  dailyMax: number;
  hourlyMax: number;
  minSecondsBetweenMessages: number;
  description: string;
}

export const TRUST_LIMITS: Record<TrustLevel, TrustLimits> = {
  [TrustLevel.NEW_USER]: {
    weeklyMax: 20,
    dailyMax: 10,
    hourlyMax: 3,
    minSecondsBetweenMessages: 10,
    description: "Nový uživatel (první týden)"
  },
  [TrustLevel.REGULAR]: {
    weeklyMax: 40,
    dailyMax: 15,
    hourlyMax: 5,
    minSecondsBetweenMessages: 10,
    description: "Běžný uživatel"
  },
  [TrustLevel.VERIFIED]: {
    weeklyMax: 60,
    dailyMax: 20,
    hourlyMax: 7,
    minSecondsBetweenMessages: 5,
    description: "Ověřená firma (IČO)"
  },
  [TrustLevel.PREMIUM]: {
    weeklyMax: 500,
    dailyMax: 100,
    hourlyMax: 30,
    minSecondsBetweenMessages: 2,
    description: "Premium účet"
  }
};

export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: 'WEEKLY_LIMIT' | 'DAILY_BURST' | 'HOURLY_LIMIT' | 'TOO_FAST' | 'BANNED';
  resetDate?: Date;
  waitSeconds?: number;
  message?: string;
  currentUsage?: {
    weekly: number;
    daily: number;
    hourly: number;
  };
  limits?: TrustLimits;
}

export interface WhatsAppMessage {
  from: string;
  to: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location';
  text?: {
    body: string;
  };
  image?: {
    id: string;
    mime_type: string;
    sha256?: string;
  };
  document?: {
    id: string;
    mime_type: string;
    filename?: string;
    sha256?: string;
  };
}

export interface WebhookPayload {
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: WhatsAppMessage[];
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface MessageResponse {
  messaging_product: string;
  to: string;
  type: 'text' | 'template' | 'image' | 'document';
  text?: {
    body: string;
    preview_url?: boolean;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
}

export interface UserStats {
  phoneNumber: string;
  trustLevel: TrustLevel;
  messagesThisWeek: number;
  messagesThisDay: number;
  messagesThisHour: number;
  weeklyLimit: number;
  dailyLimit: number;
  isBanned: boolean;
  banExpiresAt?: Date;
}

export interface SystemAlert {
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  details?: any;
  timestamp: Date;
}