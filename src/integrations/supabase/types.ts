export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      billing_history: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          payment_method: string
          payment_status: string | null
          plan: string
          processed_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method: string
          payment_status?: string | null
          plan: string
          processed_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method?: string
          payment_status?: string | null
          plan?: string
          processed_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bot_configs: {
        Row: {
          bot_name: string
          bot_token: string
          bot_type: string
          created_at: string | null
          id: string
          last_activity: string | null
          project_id: string
          status: string | null
          updated_at: string | null
          user_id: string
          webhook_secret: string | null
        }
        Insert: {
          bot_name: string
          bot_token: string
          bot_type: string
          created_at?: string | null
          id?: string
          last_activity?: string | null
          project_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          webhook_secret?: string | null
        }
        Update: {
          bot_name?: string
          bot_token?: string
          bot_type?: string
          created_at?: string | null
          id?: string
          last_activity?: string | null
          project_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_configs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      build_logs: {
        Row: {
          created_at: string
          deployment_id: string | null
          id: string
          log_level: string
          message: string
          project_id: string
          source: string
        }
        Insert: {
          created_at?: string
          deployment_id?: string | null
          id?: string
          log_level?: string
          message: string
          project_id: string
          source?: string
        }
        Update: {
          created_at?: string
          deployment_id?: string | null
          id?: string
          log_level?: string
          message?: string
          project_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "build_logs_deployment_id_fkey"
            columns: ["deployment_id"]
            isOneToOne: false
            referencedRelation: "deployments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "build_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_jobs: {
        Row: {
          command: string
          created_at: string
          error_count: number
          id: string
          last_output: string | null
          last_run: string | null
          name: string
          next_run: string
          project_id: string
          schedule: string
          status: string
          success_count: number
          updated_at: string
        }
        Insert: {
          command: string
          created_at?: string
          error_count?: number
          id?: string
          last_output?: string | null
          last_run?: string | null
          name: string
          next_run: string
          project_id: string
          schedule: string
          status?: string
          success_count?: number
          updated_at?: string
        }
        Update: {
          command?: string
          created_at?: string
          error_count?: number
          id?: string
          last_output?: string | null
          last_run?: string | null
          name?: string
          next_run?: string
          project_id?: string
          schedule?: string
          status?: string
          success_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cron_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      deployments: {
        Row: {
          build_duration: number | null
          build_status: string | null
          commit_hash: string | null
          commit_message: string | null
          created_at: string | null
          deployed_at: string | null
          deployment_url: string | null
          id: string
          project_id: string
          status: string | null
        }
        Insert: {
          build_duration?: number | null
          build_status?: string | null
          commit_hash?: string | null
          commit_message?: string | null
          created_at?: string | null
          deployed_at?: string | null
          deployment_url?: string | null
          id?: string
          project_id: string
          status?: string | null
        }
        Update: {
          build_duration?: number | null
          build_status?: string | null
          commit_hash?: string | null
          commit_message?: string | null
          created_at?: string | null
          deployed_at?: string | null
          deployment_url?: string | null
          id?: string
          project_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deployments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          payment_method: string
          payment_provider_id: string | null
          plan_name: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_method: string
          payment_provider_id?: string | null
          plan_name: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string
          payment_provider_id?: string | null
          plan_name?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          credits: number | null
          full_name: string | null
          id: string
          subscription_tier: string | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          credits?: number | null
          full_name?: string | null
          id?: string
          subscription_tier?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          credits?: number | null
          full_name?: string | null
          id?: string
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      project_files: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          project_id: string
          storage_path: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          project_id: string
          storage_path: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          project_id?: string
          storage_path?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          app_type: string
          branch: string | null
          build_command: string | null
          container_id: string | null
          container_status: string | null
          cpu_limit: number | null
          created_at: string | null
          custom_domain: string | null
          description: string | null
          disk_limit: number | null
          docker_image: string | null
          environment_variables: Json | null
          id: string
          last_deployed_at: string | null
          name: string
          port: number | null
          ram_limit: number | null
          repository_url: string | null
          runtime: string
          ssl_enabled: boolean | null
          start_command: string | null
          subdomain: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_type: string
          branch?: string | null
          build_command?: string | null
          container_id?: string | null
          container_status?: string | null
          cpu_limit?: number | null
          created_at?: string | null
          custom_domain?: string | null
          description?: string | null
          disk_limit?: number | null
          docker_image?: string | null
          environment_variables?: Json | null
          id?: string
          last_deployed_at?: string | null
          name: string
          port?: number | null
          ram_limit?: number | null
          repository_url?: string | null
          runtime: string
          ssl_enabled?: boolean | null
          start_command?: string | null
          subdomain?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_type?: string
          branch?: string | null
          build_command?: string | null
          container_id?: string | null
          container_status?: string | null
          cpu_limit?: number | null
          created_at?: string | null
          custom_domain?: string | null
          description?: string | null
          disk_limit?: number | null
          docker_image?: string | null
          environment_variables?: Json | null
          id?: string
          last_deployed_at?: string | null
          name?: string
          port?: number | null
          ram_limit?: number | null
          repository_url?: string | null
          runtime?: string
          ssl_enabled?: boolean | null
          start_command?: string | null
          subdomain?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resource_usage: {
        Row: {
          cpu_usage: number
          disk_usage: number
          id: string
          memory_usage: number
          network_in: number
          network_out: number
          project_id: string
          recorded_at: string
        }
        Insert: {
          cpu_usage?: number
          disk_usage?: number
          id?: string
          memory_usage?: number
          network_in?: number
          network_out?: number
          project_id: string
          recorded_at?: string
        }
        Update: {
          cpu_usage?: number
          disk_usage?: number
          id?: string
          memory_usage?: number
          network_in?: number
          network_out?: number
          project_id?: string
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_usage_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_requests: {
        Row: {
          body: string | null
          headers: Json
          id: string
          ip_address: unknown | null
          method: string
          processed_at: string
          project_id: string
          response_status: number | null
          url: string
          user_agent: string | null
        }
        Insert: {
          body?: string | null
          headers?: Json
          id?: string
          ip_address?: unknown | null
          method: string
          processed_at?: string
          project_id: string
          response_status?: number | null
          url: string
          user_agent?: string | null
        }
        Update: {
          body?: string | null
          headers?: Json
          id?: string
          ip_address?: unknown | null
          method?: string
          processed_at?: string
          project_id?: string
          response_status?: number | null
          url?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_next_cron_run: {
        Args: { cron_expression: string; from_time?: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
