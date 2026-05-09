// Auto-generated-style types matching supabase/migrations/001_initial_schema.sql
// Regenerate via: supabase gen types typescript --project-id <id> > src/types/database.ts

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          brand_voice_profile: Record<string, unknown>;
          industry: string | null;
          niche: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; email: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          tier: 'founding_lifetime' | 'starter_monthly' | 'pro_monthly' | 'agency_monthly';
          status: 'active' | 'past_due' | 'canceled' | 'trialing';
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          founding_seat_number: number | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['subscriptions']['Row']>;
        Update: Partial<Database['public']['Tables']['subscriptions']['Row']>;
      };
      avatars: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          age: number | null;
          gender: string | null;
          description: string | null;
          image_prompt: string;
          reference_image_url: string | null;
          voice_id: string | null;
          is_system: boolean;
          is_clone: boolean;
          tags: string[];
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['avatars']['Row']> & { name: string; image_prompt: string };
        Update: Partial<Database['public']['Tables']['avatars']['Row']>;
      };
      videos: {
        Row: {
          id: string;
          user_id: string;
          avatar_id: string | null;
          topic: string;
          hook: string | null;
          script: string | null;
          duration_seconds: number;
          model: string;
          fal_request_id: string | null;
          image_url: string | null;
          video_url: string | null;
          thumbnail_url: string | null;
          status: 'pending' | 'generating_image' | 'awaiting_approval' | 'generating_video' | 'complete' | 'failed';
          error_message: string | null;
          cost_usd: number | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['videos']['Row']> & { user_id: string; topic: string };
        Update: Partial<Database['public']['Tables']['videos']['Row']>;
      };
      content_assets: {
        Row: {
          id: string;
          user_id: string;
          source_video_id: string | null;
          source_topic: string | null;
          asset_type: 'blog' | 'x_thread' | 'linkedin_post' | 'email' | 'carousel' | 'short_script' | 'ad_copy' | 'hook_pack';
          title: string | null;
          body: string | null;
          meta: Record<string, unknown>;
          posted_to: string[] | null;
          external_urls: Record<string, string>;
          status: 'draft' | 'approved' | 'scheduled' | 'posted' | 'archived';
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['content_assets']['Row']> & { user_id: string; asset_type: string };
        Update: Partial<Database['public']['Tables']['content_assets']['Row']>;
      };
      audience_insights: {
        Row: {
          id: string;
          user_id: string;
          source: string;
          source_url: string | null;
          subreddit: string | null;
          theme: string | null;
          pain_point: string | null;
          quote: string | null;
          score: number;
          used_in_content_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['audience_insights']['Row']> & { user_id: string; source: string };
        Update: Partial<Database['public']['Tables']['audience_insights']['Row']>;
      };
      prospects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          handle: string | null;
          platform: string | null;
          email: string | null;
          source: string | null;
          stage: 'new' | 'engaged' | 'qualified' | 'call_booked' | 'proposal' | 'closed_won' | 'closed_lost';
          notes: string | null;
          last_contact: string | null;
          next_action: string | null;
          next_action_date: string | null;
          deal_value: number | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['prospects']['Row']> & { user_id: string; name: string };
        Update: Partial<Database['public']['Tables']['prospects']['Row']>;
      };
      hooks: {
        Row: {
          id: string;
          category: string;
          template: string;
          placeholder_count: number;
          performance_score: number;
          use_count: number;
          is_outlier: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['hooks']['Row']> & { category: string; template: string };
        Update: Partial<Database['public']['Tables']['hooks']['Row']>;
      };
      usage_events: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          cost_usd: number | null;
          meta: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['usage_events']['Row']> & { user_id: string; event_type: string };
        Update: Partial<Database['public']['Tables']['usage_events']['Row']>;
      };
      founding_seats: {
        Row: {
          seat_number: number;
          user_id: string | null;
          claimed_at: string;
        };
        Insert: { seat_number: number; user_id?: string | null };
        Update: Partial<Database['public']['Tables']['founding_seats']['Row']>;
      };
    };
    Functions: {
      claim_founding_seat: {
        Args: { p_user_id: string };
        Returns: number;
      };
    };
  };
};
