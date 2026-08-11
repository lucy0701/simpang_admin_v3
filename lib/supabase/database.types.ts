export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string;
          created_at: string;
          detail: string | null;
          id: number;
          ip_address: unknown;
          operator_id: string | null;
          target_id: string | null;
          target_type: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          detail?: string | null;
          id?: never;
          ip_address?: unknown;
          operator_id?: string | null;
          target_id?: string | null;
          target_type?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          detail?: string | null;
          id?: never;
          ip_address?: unknown;
          operator_id?: string | null;
          target_id?: string | null;
          target_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_operator_id_fkey";
            columns: ["operator_id"];
            isOneToOne: false;
            referencedRelation: "operator";
            referencedColumns: ["id"];
          }
        ];
      };
      approval_request: {
        Row: {
          action_type: string;
          approver_id: string | null;
          created_at: string;
          decided_at: string | null;
          id: number;
          requester_id: string | null;
          status: string;
          target_id: string | null;
          target_type: string | null;
        };
        Insert: {
          action_type: string;
          approver_id?: string | null;
          created_at?: string;
          decided_at?: string | null;
          id?: never;
          requester_id?: string | null;
          status?: string;
          target_id?: string | null;
          target_type?: string | null;
        };
        Update: {
          action_type?: string;
          approver_id?: string | null;
          created_at?: string;
          decided_at?: string | null;
          id?: never;
          requester_id?: string | null;
          status?: string;
          target_id?: string | null;
          target_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "approval_request_approver_id_fkey";
            columns: ["approver_id"];
            isOneToOne: false;
            referencedRelation: "operator";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "approval_request_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "operator";
            referencedColumns: ["id"];
          }
        ];
      };
      banned_word: {
        Row: {
          created_at: string;
          id: number;
          is_active: boolean;
          word: string;
        };
        Insert: {
          created_at?: string;
          id?: never;
          is_active?: boolean;
          word: string;
        };
        Update: {
          created_at?: string;
          id?: never;
          is_active?: boolean;
          word?: string;
        };
        Relationships: [];
      };
      comment: {
        Row: {
          body: string;
          content_id: number;
          created_at: string;
          id: number;
          member_id: string;
          parent_id: number | null;
          report_count: number;
          status: string;
          updated_at: string;
        };
        Insert: {
          body: string;
          content_id: number;
          created_at?: string;
          id?: never;
          member_id: string;
          parent_id?: number | null;
          report_count?: number;
          status?: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          content_id?: number;
          created_at?: string;
          id?: never;
          member_id?: string;
          parent_id?: number | null;
          report_count?: number;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comment_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "content";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comment_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comment_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "comment";
            referencedColumns: ["id"];
          }
        ];
      };
      comment_filter_setting: {
        Row: {
          auto_hide_banned: boolean;
          block_contact_pattern: boolean;
          content_id: number | null;
          id: number;
          review_first_comment: boolean;
          scope: string;
        };
        Insert: {
          auto_hide_banned?: boolean;
          block_contact_pattern?: boolean;
          content_id?: number | null;
          id?: never;
          review_first_comment?: boolean;
          scope?: string;
        };
        Update: {
          auto_hide_banned?: boolean;
          block_contact_pattern?: boolean;
          content_id?: number | null;
          id?: never;
          review_first_comment?: boolean;
          scope?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comment_filter_setting_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "content";
            referencedColumns: ["id"];
          }
        ];
      };
      comment_report: {
        Row: {
          action_taken: string | null;
          comment_id: number;
          created_at: string;
          handled_at: string | null;
          handled_by: string | null;
          id: number;
          reason: string;
          reporter_member_id: string;
          status: string;
        };
        Insert: {
          action_taken?: string | null;
          comment_id: number;
          created_at?: string;
          handled_at?: string | null;
          handled_by?: string | null;
          id?: never;
          reason: string;
          reporter_member_id: string;
          status?: string;
        };
        Update: {
          action_taken?: string | null;
          comment_id?: number;
          created_at?: string;
          handled_at?: string | null;
          handled_by?: string | null;
          id?: never;
          reason?: string;
          reporter_member_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comment_report_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "comment";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comment_report_handled_by_fkey";
            columns: ["handled_by"];
            isOneToOne: false;
            referencedRelation: "operator";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comment_report_reporter_member_id_fkey";
            columns: ["reporter_member_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      content: {
        Row: {
          allow_comment: boolean;
          allow_guest_play: boolean;
          author_operator_id: string | null;
          comment_count: number;
          content_type: string;
          created_at: string;
          description: string | null;
          id: number;
          is_home_featured: boolean;
          like_count: number;
          play_count: number;
          published_at: string | null;
          share_count: number;
          show_result_ad: boolean;
          slug: string | null;
          status: string;
          thumbnail: string | null;
          title: string;
          updated_at: string;
          view_count: number;
        };
        Insert: {
          allow_comment?: boolean;
          allow_guest_play?: boolean;
          author_operator_id?: string | null;
          comment_count?: number;
          content_type: string;
          created_at?: string;
          description?: string | null;
          id?: never;
          is_home_featured?: boolean;
          like_count?: number;
          play_count?: number;
          published_at?: string | null;
          share_count?: number;
          show_result_ad?: boolean;
          slug?: string | null;
          status?: string;
          thumbnail?: string | null;
          title: string;
          updated_at?: string;
          view_count?: number;
        };
        Update: {
          allow_comment?: boolean;
          allow_guest_play?: boolean;
          author_operator_id?: string | null;
          comment_count?: number;
          content_type?: string;
          created_at?: string;
          description?: string | null;
          id?: never;
          is_home_featured?: boolean;
          like_count?: number;
          play_count?: number;
          published_at?: string | null;
          share_count?: number;
          show_result_ad?: boolean;
          slug?: string | null;
          status?: string;
          thumbnail?: string | null;
          title?: string;
          updated_at?: string;
          view_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "content_author_operator_id_fkey";
            columns: ["author_operator_id"];
            isOneToOne: false;
            referencedRelation: "operator";
            referencedColumns: ["id"];
          }
        ];
      };
      content_likes: {
        Row: {
          content_id: number;
          created_at: string;
          id: number;
          member_id: string;
        };
        Insert: {
          content_id: number;
          created_at?: string;
          id?: never;
          member_id: string;
        };
        Update: {
          content_id?: number;
          created_at?: string;
          id?: never;
          member_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_likes_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "content";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_likes_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      mbti_test_question: {
        Row: {
          content_id: number;
          created_at: string;
          questions: Json;
          updated_at: string;
        };
        Insert: {
          content_id: number;
          created_at?: string;
          questions?: Json;
          updated_at?: string;
        };
        Update: {
          content_id?: number;
          created_at?: string;
          questions?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mbti_test_question_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: true;
            referencedRelation: "content";
            referencedColumns: ["id"];
          }
        ];
      };
      mbti_test_result_type: {
        Row: {
          card_image: string | null;
          content_id: number;
          created_at: string;
          description: string | null;
          id: number;
          max_score: number | null;
          min_score: number | null;
          name: string;
          updated_at: string;
        };
        Insert: {
          card_image?: string | null;
          content_id: number;
          created_at?: string;
          description?: string | null;
          id?: never;
          max_score?: number | null;
          min_score?: number | null;
          name: string;
          updated_at?: string;
        };
        Update: {
          card_image?: string | null;
          content_id?: number;
          created_at?: string;
          description?: string | null;
          id?: never;
          max_score?: number | null;
          min_score?: number | null;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mbti_test_result_type_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "content";
            referencedColumns: ["id"];
          }
        ];
      };
      member_sanction: {
        Row: {
          created_at: string;
          ends_at: string | null;
          id: number;
          member_id: string;
          operator_id: string | null;
          reason: string | null;
          related_report_id: number | null;
          starts_at: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          ends_at?: string | null;
          id?: never;
          member_id: string;
          operator_id?: string | null;
          reason?: string | null;
          related_report_id?: number | null;
          starts_at?: string;
          type: string;
        };
        Update: {
          created_at?: string;
          ends_at?: string | null;
          id?: never;
          member_id?: string;
          operator_id?: string | null;
          reason?: string | null;
          related_report_id?: number | null;
          starts_at?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "member_sanction_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_sanction_operator_id_fkey";
            columns: ["operator_id"];
            isOneToOne: false;
            referencedRelation: "operator";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_sanction_related_report_id_fkey";
            columns: ["related_report_id"];
            isOneToOne: false;
            referencedRelation: "comment_report";
            referencedColumns: ["id"];
          }
        ];
      };
      operator: {
        Row: {
          auth_user_id: string | null;
          created_at: string;
          email: string;
          id: string;
          is_2fa_enabled: boolean;
          is_external: boolean;
          last_access_at: string | null;
          name: string;
          role_id: number | null;
          status: string;
        };
        Insert: {
          auth_user_id?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          is_2fa_enabled?: boolean;
          is_external?: boolean;
          last_access_at?: string | null;
          name: string;
          role_id?: number | null;
          status?: string;
        };
        Update: {
          auth_user_id?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          is_2fa_enabled?: boolean;
          is_external?: boolean;
          last_access_at?: string | null;
          name?: string;
          role_id?: number | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operator_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "role";
            referencedColumns: ["id"];
          }
        ];
      };
      operator_invite: {
        Row: {
          created_at: string;
          email: string;
          expires_at: string;
          id: number;
          invited_by: string | null;
          role_id: number | null;
          status: string;
          token: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          expires_at: string;
          id?: never;
          invited_by?: string | null;
          role_id?: number | null;
          status?: string;
          token: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: never;
          invited_by?: string | null;
          role_id?: number | null;
          status?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operator_invite_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "operator";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operator_invite_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "role";
            referencedColumns: ["id"];
          }
        ];
      };
      permission: {
        Row: {
          code: string;
          id: number;
          name: string;
        };
        Insert: {
          code: string;
          id?: never;
          name: string;
        };
        Update: {
          code?: string;
          id?: never;
          name?: string;
        };
        Relationships: [];
      };
      pii_access_grant: {
        Row: {
          created_at: string;
          expires_at: string;
          granted_by: string | null;
          id: number;
          operator_id: string;
          reason: string | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          granted_by?: string | null;
          id?: never;
          operator_id: string;
          reason?: string | null;
          status?: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          granted_by?: string | null;
          id?: never;
          operator_id?: string;
          reason?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pii_access_grant_granted_by_fkey";
            columns: ["granted_by"];
            isOneToOne: false;
            referencedRelation: "operator";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pii_access_grant_operator_id_fkey";
            columns: ["operator_id"];
            isOneToOne: false;
            referencedRelation: "operator";
            referencedColumns: ["id"];
          }
        ];
      };
      pii_view_log: {
        Row: {
          id: number;
          ip_address: unknown;
          operator_id: string;
          reason: string;
          target_member_id: string | null;
          viewed_at: string;
        };
        Insert: {
          id?: never;
          ip_address?: unknown;
          operator_id: string;
          reason: string;
          target_member_id?: string | null;
          viewed_at?: string;
        };
        Update: {
          id?: never;
          ip_address?: unknown;
          operator_id?: string;
          reason?: string;
          target_member_id?: string | null;
          viewed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pii_view_log_operator_id_fkey";
            columns: ["operator_id"];
            isOneToOne: false;
            referencedRelation: "operator";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pii_view_log_target_member_id_fkey";
            columns: ["target_member_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      play_log: {
        Row: {
          content_id: number;
          created_at: string;
          finished_at: string | null;
          id: number;
          is_completed: boolean;
          member_id: string | null;
          result_type_id: number | null;
          session_id: string | null;
          started_at: string;
        };
        Insert: {
          content_id: number;
          created_at?: string;
          finished_at?: string | null;
          id?: never;
          is_completed?: boolean;
          member_id?: string | null;
          result_type_id?: number | null;
          session_id?: string | null;
          started_at?: string;
        };
        Update: {
          content_id?: number;
          created_at?: string;
          finished_at?: string | null;
          id?: never;
          is_completed?: boolean;
          member_id?: string | null;
          result_type_id?: number | null;
          session_id?: string | null;
          started_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "play_log_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "content";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "play_log_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "play_log_result_type_id_fkey";
            columns: ["result_type_id"];
            isOneToOne: false;
            referencedRelation: "mbti_test_result_type";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          comment_count: number;
          created_at: string;
          id: string;
          last_login_at: string | null;
          member_no: string | null;
          nickname: string | null;
          play_count: number;
          profile_image: string | null;
          provider: string | null;
          report_received: number;
          status: string;
          tier: string;
          updated_at: string;
        };
        Insert: {
          comment_count?: number;
          created_at?: string;
          id: string;
          last_login_at?: string | null;
          member_no?: string | null;
          nickname?: string | null;
          play_count?: number;
          profile_image?: string | null;
          provider?: string | null;
          report_received?: number;
          status?: string;
          tier?: string;
          updated_at?: string;
        };
        Update: {
          comment_count?: number;
          created_at?: string;
          id?: string;
          last_login_at?: string | null;
          member_no?: string | null;
          nickname?: string | null;
          play_count?: number;
          profile_image?: string | null;
          provider?: string | null;
          report_received?: number;
          status?: string;
          tier?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      role: {
        Row: {
          code: string;
          created_at: string;
          id: number;
          is_system: boolean;
          name: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: never;
          is_system?: boolean;
          name: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: never;
          is_system?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      role_permission: {
        Row: {
          effect: string;
          permission_id: number;
          role_id: number;
        };
        Insert: {
          effect?: string;
          permission_id: number;
          role_id: number;
        };
        Update: {
          effect?: string;
          permission_id?: number;
          role_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "role_permission_permission_id_fkey";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permission";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "role_permission_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "role";
            referencedColumns: ["id"];
          }
        ];
      };
      share_log: {
        Row: {
          channel: string | null;
          content_id: number;
          created_at: string;
          id: number;
          result_type_id: number | null;
          sharer_member_id: string | null;
        };
        Insert: {
          channel?: string | null;
          content_id: number;
          created_at?: string;
          id?: never;
          result_type_id?: number | null;
          sharer_member_id?: string | null;
        };
        Update: {
          channel?: string | null;
          content_id?: number;
          created_at?: string;
          id?: never;
          result_type_id?: number | null;
          sharer_member_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "share_log_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "content";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "share_log_result_type_id_fkey";
            columns: ["result_type_id"];
            isOneToOne: false;
            referencedRelation: "mbti_test_result_type";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "share_log_sharer_member_id_fkey";
            columns: ["sharer_member_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      mbti_code:
        | "INTP"
        | "INTJ"
        | "INFP"
        | "INFJ"
        | "ISTP"
        | "ISTJ"
        | "ISFP"
        | "ISFJ"
        | "ENTP"
        | "ENTJ"
        | "ENFP"
        | "ENFJ"
        | "ESTP"
        | "ESTJ"
        | "ESFP"
        | "ESFJ";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      mbti_code: [
        "INTP",
        "INTJ",
        "INFP",
        "INFJ",
        "ISTP",
        "ISTJ",
        "ISFP",
        "ISFJ",
        "ENTP",
        "ENTJ",
        "ENFP",
        "ENFJ",
        "ESTP",
        "ESTJ",
        "ESFP",
        "ESFJ",
      ],
    },
  },
} as const;
