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
      article_categories: {
        Row: {
          article_id: string
          category_id: string
        }
        Insert: {
          article_id: string
          category_id: string
        }
        Update: {
          article_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_categories_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_id: string
          content: string
          cover: string | null
          description: string | null
          draft: boolean
          embedding: string | null
          featured: boolean | null
          id: string
          issue_id: string | null
          published_at: string | null
          slug: string | null
          title: string
        }
        Insert: {
          author_id: string
          content: string
          cover?: string | null
          description?: string | null
          draft?: boolean
          embedding?: string | null
          featured?: boolean | null
          id?: string
          issue_id?: string | null
          published_at?: string | null
          slug?: string | null
          title: string
        }
        Update: {
          author_id?: string
          content?: string
          cover?: string | null
          description?: string | null
          draft?: boolean
          embedding?: string | null
          featured?: boolean | null
          id?: string
          issue_id?: string | null
          published_at?: string | null
          slug?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          cover: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          cover?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          cover?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      issues: {
        Row: {
          cover: string | null
          created_at: string | null
          description: string | null
          id: string
          is_special: boolean | null
          published_at: string | null
          slug: string | null
          status: string
          title: string
        }
        Insert: {
          cover?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_special?: boolean | null
          published_at?: string | null
          slug?: string | null
          status?: string
          title: string
        }
        Update: {
          cover?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_special?: boolean | null
          published_at?: string | null
          slug?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      laveille: {
        Row: {
          cover: string | null
          description: string | null
          id: string
          source: string | null
          status: string
          submitted_at: string
          submitter_id: string | null
          title: string
          type: string
          url: string | null
        }
        Insert: {
          cover?: string | null
          description?: string | null
          id?: string
          source?: string | null
          status?: string
          submitted_at?: string
          submitter_id?: string | null
          title: string
          type?: string
          url?: string | null
        }
        Update: {
          cover?: string | null
          description?: string | null
          id?: string
          source?: string | null
          status?: string
          submitted_at?: string
          submitter_id?: string | null
          title?: string
          type?: string
          url?: string | null
        }
        Relationships: []
      }
      laveille_votes: {
        Row: {
          article_id: string
          created_at: string
          id: string
          voter_id: string | null
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          voter_id?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          voter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "laveille_votes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "laveille"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          email: string
          full_name: string | null
          joined_at: string
          phone: string | null
          role: string
          uni_year: string | null
          user_id: string | null
        }
        Insert: {
          email: string
          full_name?: string | null
          joined_at?: string
          phone?: string | null
          role: string
          uni_year?: string | null
          user_id?: string | null
        }
        Update: {
          email?: string
          full_name?: string | null
          joined_at?: string
          phone?: string | null
          role?: string
          uni_year?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      get_article_draft: {
        Args: { aid: string }
        Returns: boolean
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: { uid: string; wanted_role: string }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_self: {
        Args: { uid: string; mem_email: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      query_embeddings: {
        Args: { embedding: string; match_threshold: number }
        Returns: {
          author_id: string
          content: string
          cover: string | null
          description: string | null
          draft: boolean
          embedding: string | null
          featured: boolean | null
          id: string
          issue_id: string | null
          published_at: string | null
          slug: string | null
          title: string
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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
