export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      episodes: {
        Row: {
          created_at: string
          id: string
          process_id: string
          progress_percent: number
          show_id: string
          status: string
          title: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          process_id: string
          progress_percent?: number
          show_id: string
          status?: string
          title: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          created_at?: string
          id?: string
          process_id?: string
          progress_percent?: number
          show_id?: string
          status?: string
          title?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episodes_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episodes_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          email_on_comment_mention: boolean
          email_on_task_assigned: boolean
          email_on_task_due: boolean
          email_on_task_starting: boolean
          id: string
          on_comment_mention: boolean
          on_task_assigned: boolean
          on_task_due: boolean
          on_task_starting: boolean
          user_id: string
        }
        Insert: {
          email_on_comment_mention?: boolean
          email_on_task_assigned?: boolean
          email_on_task_due?: boolean
          email_on_task_starting?: boolean
          id?: string
          on_comment_mention?: boolean
          on_task_assigned?: boolean
          on_task_due?: boolean
          on_task_starting?: boolean
          user_id: string
        }
        Update: {
          email_on_comment_mention?: boolean
          email_on_task_assigned?: boolean
          email_on_task_due?: boolean
          email_on_task_starting?: boolean
          id?: string
          on_comment_mention?: boolean
          on_task_assigned?: boolean
          on_task_due?: boolean
          on_task_starting?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_members: {
        Row: {
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      show_role_assignments: {
        Row: {
          id: string
          role_id: string
          show_id: string
          user_id: string
        }
        Insert: {
          id?: string
          role_id: string
          show_id: string
          user_id: string
        }
        Update: {
          id?: string
          role_id?: string
          show_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "show_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "show_role_assignments_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "show_role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      show_setting_definitions: {
        Row: {
          created_at: string
          display_order: number
          field_type: string
          id: string
          label: string
          options_json: Json | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          field_type: string
          id?: string
          label: string
          options_json?: Json | null
        }
        Update: {
          created_at?: string
          display_order?: number
          field_type?: string
          id?: string
          label?: string
          options_json?: Json | null
        }
        Relationships: []
      }
      show_setting_values: {
        Row: {
          id: string
          setting_definition_id: string
          show_id: string
          updated_at: string
          value_json: Json | null
        }
        Insert: {
          id?: string
          setting_definition_id: string
          show_id: string
          updated_at?: string
          value_json?: Json | null
        }
        Update: {
          id?: string
          setting_definition_id?: string
          show_id?: string
          updated_at?: string
          value_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "show_setting_values_setting_definition_id_fkey"
            columns: ["setting_definition_id"]
            isOneToOne: false
            referencedRelation: "show_setting_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "show_setting_values_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      shows: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_block_responses: {
        Row: {
          id: string
          task_id: string
          task_instance_block_id: string | null
          task_template_block_id: string | null
          updated_at: string
          value_json: Json | null
        }
        Insert: {
          id?: string
          task_id: string
          task_instance_block_id?: string | null
          task_template_block_id?: string | null
          updated_at?: string
          value_json?: Json | null
        }
        Update: {
          id?: string
          task_id?: string
          task_instance_block_id?: string | null
          task_template_block_id?: string | null
          updated_at?: string
          value_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "task_block_responses_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_block_responses_task_instance_block_id_fkey"
            columns: ["task_instance_block_id"]
            isOneToOne: false
            referencedRelation: "task_instance_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_block_responses_task_template_block_id_fkey"
            columns: ["task_template_block_id"]
            isOneToOne: false
            referencedRelation: "task_template_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_instance_blocks: {
        Row: {
          block_type: string
          created_at: string
          display_order: number
          id: string
          label: string
          options_json: Json | null
          required: boolean
          task_id: string
        }
        Insert: {
          block_type: string
          created_at?: string
          display_order?: number
          id?: string
          label?: string
          options_json?: Json | null
          required?: boolean
          task_id: string
        }
        Update: {
          block_type?: string
          created_at?: string
          display_order?: number
          id?: string
          label?: string
          options_json?: Json | null
          required?: boolean
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_instance_blocks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_template_blocks: {
        Row: {
          block_type: string
          display_order: number
          id: string
          label: string
          options_json: Json | null
          required: boolean
          task_template_id: string
          token_name: string | null
        }
        Insert: {
          block_type: string
          display_order?: number
          id?: string
          label: string
          options_json?: Json | null
          required?: boolean
          task_template_id: string
          token_name?: string | null
        }
        Update: {
          block_type?: string
          display_order?: number
          id?: string
          label?: string
          options_json?: Json | null
          required?: boolean
          task_template_id?: string
          token_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_template_blocks_task_template_id_fkey"
            columns: ["task_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_template_completion_actions: {
        Row: {
          action_type: string
          config_json: Json | null
          id: string
          task_template_id: string
        }
        Insert: {
          action_type: string
          config_json?: Json | null
          id?: string
          task_template_id: string
        }
        Update: {
          action_type?: string
          config_json?: Json | null
          id?: string
          task_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_template_completion_actions_task_template_id_fkey"
            columns: ["task_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_template_date_rules: {
        Row: {
          date_field: string
          id: string
          offset_days: number
          offset_hours: number
          relative_task_template_id: string | null
          relative_to: string
          task_template_id: string
        }
        Insert: {
          date_field: string
          id?: string
          offset_days?: number
          offset_hours?: number
          relative_task_template_id?: string | null
          relative_to: string
          task_template_id: string
        }
        Update: {
          date_field?: string
          id?: string
          offset_days?: number
          offset_hours?: number
          relative_task_template_id?: string | null
          relative_to?: string
          task_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_template_date_rules_relative_task_template_id_fkey"
            columns: ["relative_task_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_template_date_rules_task_template_id_fkey"
            columns: ["task_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_template_dependencies: {
        Row: {
          condition_type: string
          depends_on_task_template_id: string
          id: string
          task_template_id: string
        }
        Insert: {
          condition_type?: string
          depends_on_task_template_id: string
          id?: string
          task_template_id: string
        }
        Update: {
          condition_type?: string
          depends_on_task_template_id?: string
          id?: string
          task_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_template_dependencies_depends_on_task_template_id_fkey"
            columns: ["depends_on_task_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_template_dependencies_task_template_id_fkey"
            columns: ["task_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_template_email_templates: {
        Row: {
          auto_send_on_complete: boolean
          body_template: string
          from_name: string
          id: string
          subject_template: string
          task_template_id: string
        }
        Insert: {
          auto_send_on_complete?: boolean
          body_template: string
          from_name: string
          id?: string
          subject_template: string
          task_template_id: string
        }
        Update: {
          auto_send_on_complete?: boolean
          body_template?: string
          from_name?: string
          id?: string
          subject_template?: string
          task_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_template_email_templates_task_template_id_fkey"
            columns: ["task_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_template_visibility_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          operator: string
          setting_definition_id: string
          target_value: string | null
          task_template_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          operator: string
          setting_definition_id: string
          target_value?: string | null
          task_template_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          operator?: string
          setting_definition_id?: string
          target_value?: string | null
          task_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_template_visibility_rules_setting_definition_id_fkey"
            columns: ["setting_definition_id"]
            isOneToOne: false
            referencedRelation: "show_setting_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_template_visibility_rules_task_template_id_fkey"
            columns: ["task_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          assigned_role_id: string | null
          assigned_user_id: string | null
          assignment_mode: string
          created_at: string
          description: string | null
          id: string
          position: number
          process_id: string
          title: string
          updated_at: string
          visibility_logic: string
        }
        Insert: {
          assigned_role_id?: string | null
          assigned_user_id?: string | null
          assignment_mode?: string
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          process_id: string
          title: string
          updated_at?: string
          visibility_logic?: string
        }
        Update: {
          assigned_role_id?: string | null
          assigned_user_id?: string | null
          assignment_mode?: string
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          process_id?: string
          title?: string
          updated_at?: string
          visibility_logic?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_assigned_role_id_fkey"
            columns: ["assigned_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_user_id: string | null
          block_order: Json | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          due_date: string | null
          email_body_override: string | null
          episode_id: string
          hidden_template_block_ids: Json
          id: string
          instance_actions: Json | null
          instance_dependencies: Json | null
          instance_email_template: Json | null
          instance_visibility_rules: Json | null
          is_visible: boolean
          notifications_sent: Json | null
          position: number
          start_date: string | null
          status: string
          task_template_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_user_id?: string | null
          block_order?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_date?: string | null
          email_body_override?: string | null
          episode_id: string
          hidden_template_block_ids?: Json
          id?: string
          instance_actions?: Json | null
          instance_dependencies?: Json | null
          instance_email_template?: Json | null
          instance_visibility_rules?: Json | null
          is_visible?: boolean
          notifications_sent?: Json | null
          position?: number
          start_date?: string | null
          status?: string
          task_template_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_user_id?: string | null
          block_order?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_date?: string | null
          email_body_override?: string | null
          episode_id?: string
          hidden_template_block_ids?: Json
          id?: string
          instance_actions?: Json | null
          instance_dependencies?: Json | null
          instance_email_template?: Json | null
          instance_visibility_rules?: Json | null
          is_visible?: boolean
          notifications_sent?: Json | null
          position?: number
          start_date?: string | null
          status?: string
          task_template_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_task_template_id_fkey"
            columns: ["task_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          full_name: string
          id: string
          last_name: string | null
          role: string
          slack_webhook_url: string | null
          timezone: string | null
        }
        Insert: {
          auth_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          full_name: string
          id?: string
          last_name?: string | null
          role?: string
          slack_webhook_url?: string | null
          timezone?: string | null
        }
        Update: {
          auth_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          full_name?: string
          id?: string
          last_name?: string | null
          role?: string
          slack_webhook_url?: string | null
          timezone?: string | null
        }
        Relationships: []
      }
      workflows: {
        Row: {
          created_at: string
          id: string
          item_label: string
          name: string
          process_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_label?: string
          name: string
          process_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_label?: string
          name?: string
          process_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_episode_with_tasks: {
        Args: {
          p_created_by_user_id?: string
          p_process_id: string
          p_show_id: string
          p_title: string
          p_workflow_id: string
        }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
A new version of Supabase CLI is available: v2.105.0 (currently installed v2.75.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
