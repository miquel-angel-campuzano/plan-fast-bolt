export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      todos: {
        Row: {
          id: string
          user_id: string
          task: string
          is_complete: boolean
          inserted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task: string
          is_complete?: boolean
          inserted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task?: string
          is_complete?: boolean
          inserted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "todos_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      places: {
        Row: {
          id: string;
          name: string;
          description: string;
          umbrella_category: string;
          duration: string | null;
          local_tip: string | null;
          maps_url: string | null;
          website: string | null;
          price_level: string | null;
          city: string;
          popularity_score: number;
        };
        Insert: Partial<Database['public']['Tables']['places']['Row']>;
        Update: Partial<Database['public']['Tables']['places']['Row']>;
        Relationships: [];
      },
      saved_trips: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          city: string;
          categories: string[];
          travel_style: string;
          places: any[];
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['saved_trips']['Row']>;
        Update: Partial<Database['public']['Tables']['saved_trips']['Row']>;
        Relationships: [];
      },
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_distinct_cities: {
        Args: Record<string, never>;
        Returns: string[];
      };
    }
    Enums: {
      [_ in never]: never
    }
  }
}