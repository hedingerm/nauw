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
      Appointment: {
        Row: {
          businessId: string
          cancellationReason: string | null
          createdAt: string
          customerId: string
          employeeId: string
          endTime: string
          id: string
          notes: string | null
          serviceId: string
          startTime: string
          status: Database["public"]["Enums"]["appointment_status"]
          updatedAt: string
        }
        Insert: {
          businessId: string
          cancellationReason?: string | null
          createdAt?: string
          customerId: string
          employeeId: string
          endTime: string
          id?: string
          notes?: string | null
          serviceId: string
          startTime: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updatedAt?: string
        }
        Update: {
          businessId?: string
          cancellationReason?: string | null
          createdAt?: string
          customerId?: string
          employeeId?: string
          endTime?: string
          id?: string
          notes?: string | null
          serviceId?: string
          startTime?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Appointment_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Appointment_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Appointment_employeeId_fkey"
            columns: ["employeeId"]
            isOneToOne: false
            referencedRelation: "Employee"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Appointment_serviceId_fkey"
            columns: ["serviceId"]
            isOneToOne: false
            referencedRelation: "Service"
            referencedColumns: ["id"]
          },
        ]
      }
      BookingPageConfig: {
        Row: {
          businessId: string
          content: Json | null
          coverImageUrl: string | null
          createdAt: string | null
          customCSS: string | null
          faviconUrl: string | null
          features: Json | null
          id: string
          layout: Json | null
          logoUrl: string | null
          seo: Json | null
          theme: Json | null
          updatedAt: string | null
        }
        Insert: {
          businessId: string
          content?: Json | null
          coverImageUrl?: string | null
          createdAt?: string | null
          customCSS?: string | null
          faviconUrl?: string | null
          features?: Json | null
          id?: string
          layout?: Json | null
          logoUrl?: string | null
          seo?: Json | null
          theme?: Json | null
          updatedAt?: string | null
        }
        Update: {
          businessId?: string
          content?: Json | null
          coverImageUrl?: string | null
          createdAt?: string | null
          customCSS?: string | null
          faviconUrl?: string | null
          features?: Json | null
          id?: string
          layout?: Json | null
          logoUrl?: string | null
          seo?: Json | null
          theme?: Json | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "BookingPageConfig_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: true
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
        ]
      }
      Business: {
        Row: {
          acceptAppointmentsAutomatically: boolean
          address: string
          billing_email: string | null
          businessHours: Json
          city: string
          country: string
          createdAt: string
          description: string | null
          email: string
          id: string
          isActive: boolean
          name: string
          payment_method_brand: string | null
          payment_method_last4: string | null
          phone: string
          postalCode: string
          stripe_customer_id: string | null
          subscription_id: string | null
          trial_ends_at: string | null
          type: string
          updatedAt: string
          urlSlug: string
          userId: string | null
        }
        Insert: {
          acceptAppointmentsAutomatically?: boolean
          address: string
          billing_email?: string | null
          businessHours: Json
          city: string
          country?: string
          createdAt?: string
          description?: string | null
          email: string
          id?: string
          isActive?: boolean
          name: string
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          phone: string
          postalCode: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          trial_ends_at?: string | null
          type: string
          updatedAt?: string
          urlSlug: string
          userId?: string | null
        }
        Update: {
          acceptAppointmentsAutomatically?: boolean
          address?: string
          billing_email?: string | null
          businessHours?: Json
          city?: string
          country?: string
          createdAt?: string
          description?: string | null
          email?: string
          id?: string
          isActive?: boolean
          name?: string
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          phone?: string
          postalCode?: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          trial_ends_at?: string | null
          type?: string
          updatedAt?: string
          urlSlug?: string
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Business_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "Subscription"
            referencedColumns: ["id"]
          },
        ]
      }
      Customer: {
        Row: {
          address: string | null
          birthday: string | null
          businessId: string
          city: string | null
          createdAt: string
          email: string | null
          gender: string | null
          id: string
          isActive: boolean
          lastContactedAt: string | null
          marketingConsent: boolean | null
          name: string
          notes: string | null
          phone: string | null
          postalCode: string | null
          preferredContactMethod: string | null
          source: string | null
          tags: string[] | null
          updatedAt: string
          vipStatus: boolean | null
        }
        Insert: {
          address?: string | null
          birthday?: string | null
          businessId: string
          city?: string | null
          createdAt?: string
          email?: string | null
          gender?: string | null
          id?: string
          isActive?: boolean
          lastContactedAt?: string | null
          marketingConsent?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          postalCode?: string | null
          preferredContactMethod?: string | null
          source?: string | null
          tags?: string[] | null
          updatedAt?: string
          vipStatus?: boolean | null
        }
        Update: {
          address?: string | null
          birthday?: string | null
          businessId?: string
          city?: string | null
          createdAt?: string
          email?: string | null
          gender?: string | null
          id?: string
          isActive?: boolean
          lastContactedAt?: string | null
          marketingConsent?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          postalCode?: string | null
          preferredContactMethod?: string | null
          source?: string | null
          tags?: string[] | null
          updatedAt?: string
          vipStatus?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "Customer_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
        ]
      }
      CustomerGroup: {
        Row: {
          businessId: string
          color: string
          createdAt: string | null
          description: string | null
          id: string
          name: string
          updatedAt: string | null
        }
        Insert: {
          businessId: string
          color?: string
          createdAt?: string | null
          description?: string | null
          id?: string
          name: string
          updatedAt?: string | null
        }
        Update: {
          businessId?: string
          color?: string
          createdAt?: string | null
          description?: string | null
          id?: string
          name?: string
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "CustomerGroup_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
        ]
      }
      CustomerGroupMember: {
        Row: {
          addedAt: string | null
          customerId: string
          groupId: string
          id: string
        }
        Insert: {
          addedAt?: string | null
          customerId: string
          groupId: string
          id?: string
        }
        Update: {
          addedAt?: string | null
          customerId?: string
          groupId?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "CustomerGroupMember_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CustomerGroupMember_groupId_fkey"
            columns: ["groupId"]
            isOneToOne: false
            referencedRelation: "CustomerGroup"
            referencedColumns: ["id"]
          },
        ]
      }
      CustomerNote: {
        Row: {
          authorId: string
          businessId: string
          content: string
          createdAt: string | null
          customerId: string
          id: string
          isPrivate: boolean | null
          updatedAt: string | null
        }
        Insert: {
          authorId: string
          businessId: string
          content: string
          createdAt?: string | null
          customerId: string
          id?: string
          isPrivate?: boolean | null
          updatedAt?: string | null
        }
        Update: {
          authorId?: string
          businessId?: string
          content?: string
          createdAt?: string | null
          customerId?: string
          id?: string
          isPrivate?: boolean | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "CustomerNote_authorId_fkey"
            columns: ["authorId"]
            isOneToOne: false
            referencedRelation: "Employee"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CustomerNote_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CustomerNote_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "Customer"
            referencedColumns: ["id"]
          },
        ]
      }
      Employee: {
        Row: {
          businessId: string
          canPerformServices: boolean
          createdAt: string
          email: string
          id: string
          isActive: boolean
          name: string
          phone: string | null
          role: string
          updatedAt: string
          workingHours: Json | null
        }
        Insert: {
          businessId: string
          canPerformServices?: boolean
          createdAt?: string
          email: string
          id?: string
          isActive?: boolean
          name: string
          phone?: string | null
          role?: string
          updatedAt?: string
          workingHours?: Json | null
        }
        Update: {
          businessId?: string
          canPerformServices?: boolean
          createdAt?: string
          email?: string
          id?: string
          isActive?: boolean
          name?: string
          phone?: string | null
          role?: string
          updatedAt?: string
          workingHours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "Employee_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
        ]
      }
      EmployeeService: {
        Row: {
          employeeId: string
          id: string
          serviceId: string
        }
        Insert: {
          employeeId: string
          id?: string
          serviceId: string
        }
        Update: {
          employeeId?: string
          id?: string
          serviceId?: string
        }
        Relationships: [
          {
            foreignKeyName: "EmployeeService_employeeId_fkey"
            columns: ["employeeId"]
            isOneToOne: false
            referencedRelation: "Employee"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "EmployeeService_serviceId_fkey"
            columns: ["serviceId"]
            isOneToOne: false
            referencedRelation: "Service"
            referencedColumns: ["id"]
          },
        ]
      }
      Invoice: {
        Row: {
          amount_paid: number | null
          amount_total: number
          business_id: string
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string
          invoice_number: string
          line_items: Json
          metadata: Json | null
          paid_at: string | null
          payment_method_type: string | null
          period_end: string
          period_start: string
          status: string
          stripe_invoice_id: string | null
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          amount_total: number
          business_id: string
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          line_items?: Json
          metadata?: Json | null
          paid_at?: string | null
          payment_method_type?: string | null
          period_end: string
          period_start: string
          status: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          amount_total?: number
          business_id?: string
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          line_items?: Json
          metadata?: Json | null
          paid_at?: string | null
          payment_method_type?: string | null
          period_end?: string
          period_start?: string
          status?: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Invoice_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Invoice_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "Subscription"
            referencedColumns: ["id"]
          },
        ]
      }
      Notification: {
        Row: {
          business_id: string
          content: string
          created_at: string
          email: string
          error: string | null
          id: string
          read_at: string | null
          sent_at: string
          status: string | null
          subject: string
          type: string
        }
        Insert: {
          business_id: string
          content: string
          created_at?: string
          email: string
          error?: string | null
          id?: string
          read_at?: string | null
          sent_at?: string
          status?: string | null
          subject: string
          type: string
        }
        Update: {
          business_id?: string
          content?: string
          created_at?: string
          email?: string
          error?: string | null
          id?: string
          read_at?: string | null
          sent_at?: string
          status?: string | null
          subject?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "Notification_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
        ]
      }
      NotificationLog: {
        Row: {
          key: string
          sent_at: string
          updated_at: string
        }
        Insert: {
          key: string
          sent_at: string
          updated_at?: string
        }
        Update: {
          key?: string
          sent_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ScheduleException: {
        Row: {
          createdAt: string
          date: string
          employeeId: string
          endTime: string | null
          id: string
          reason: string | null
          startTime: string | null
          type: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          date: string
          employeeId: string
          endTime?: string | null
          id?: string
          reason?: string | null
          startTime?: string | null
          type: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          date?: string
          employeeId?: string
          endTime?: string | null
          id?: string
          reason?: string | null
          startTime?: string | null
          type?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "ScheduleException_employeeId_fkey"
            columns: ["employeeId"]
            isOneToOne: false
            referencedRelation: "Employee"
            referencedColumns: ["id"]
          },
        ]
      }
      Service: {
        Row: {
          bufferAfter: number
          bufferBefore: number
          businessId: string
          categoryId: string | null
          createdAt: string
          description: string | null
          duration: number
          id: string
          isActive: boolean
          name: string
          price: number
          updatedAt: string
        }
        Insert: {
          bufferAfter?: number
          bufferBefore?: number
          businessId: string
          categoryId?: string | null
          createdAt?: string
          description?: string | null
          duration: number
          id?: string
          isActive?: boolean
          name: string
          price: number
          updatedAt?: string
        }
        Update: {
          bufferAfter?: number
          bufferBefore?: number
          businessId?: string
          categoryId?: string | null
          createdAt?: string
          description?: string | null
          duration?: number
          id?: string
          isActive?: boolean
          name?: string
          price?: number
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Service_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Service_categoryId_fkey"
            columns: ["categoryId"]
            isOneToOne: false
            referencedRelation: "ServiceCategory"
            referencedColumns: ["id"]
          },
        ]
      }
      ServiceCategory: {
        Row: {
          businessId: string
          createdAt: string | null
          description: string | null
          displayOrder: number | null
          id: string
          name: string
          updatedAt: string | null
        }
        Insert: {
          businessId: string
          createdAt?: string | null
          description?: string | null
          displayOrder?: number | null
          id?: string
          name: string
          updatedAt?: string | null
        }
        Update: {
          businessId?: string
          createdAt?: string | null
          description?: string | null
          displayOrder?: number | null
          id?: string
          name?: string
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ServiceCategory_businessId_fkey"
            columns: ["businessId"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
        ]
      }
      Subscription: {
        Row: {
          billing_cycle: string
          business_id: string
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          metadata: Json | null
          plan_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
        }
        Insert: {
          billing_cycle: string
          business_id: string
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          metadata?: Json | null
          plan_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: string
          business_id?: string
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          metadata?: Json | null
          plan_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Subscription_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Subscription_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "SubscriptionPlan"
            referencedColumns: ["id"]
          },
        ]
      }
      SubscriptionPlan: {
        Row: {
          bookings_included: number
          created_at: string | null
          display_order: number | null
          features: Json
          id: string
          is_active: boolean | null
          name: string
          price_annual: number
          price_monthly: number
          stripe_price_annual_id: string | null
          stripe_price_monthly_id: string | null
          stripe_product_id: string | null
          updated_at: string | null
        }
        Insert: {
          bookings_included: number
          created_at?: string | null
          display_order?: number | null
          features?: Json
          id?: string
          is_active?: boolean | null
          name: string
          price_annual: number
          price_monthly: number
          stripe_price_annual_id?: string | null
          stripe_price_monthly_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bookings_included?: number
          created_at?: string | null
          display_order?: number | null
          features?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          price_annual?: number
          price_monthly?: number
          stripe_price_annual_id?: string | null
          stripe_price_monthly_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      UsageLog: {
        Row: {
          amount: number
          appointment_id: string | null
          billing_period_end: string
          billing_period_start: string
          business_id: string
          created_at: string | null
          description: string | null
          id: string
          subscription_id: string
          usage_type: string
        }
        Insert: {
          amount?: number
          appointment_id?: string | null
          billing_period_end: string
          billing_period_start: string
          business_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          subscription_id: string
          usage_type: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          billing_period_end?: string
          billing_period_start?: string
          business_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          subscription_id?: string
          usage_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "UsageLog_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "Appointment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "UsageLog_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "Business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "UsageLog_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "Subscription"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_subscription_usage: {
        Args: { sub_id: string; period_start: string; period_end: string }
        Returns: {
          total_bookings: number
          included_bookings: number
          overage_bookings: number
          booster_bookings: number
        }[]
      }
      generate_slug: {
        Args: { input_text: string }
        Returns: string
      }
    }
    Enums: {
      appointment_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show"
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
    Enums: {
      appointment_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "no_show",
      ],
    },
  },
} as const