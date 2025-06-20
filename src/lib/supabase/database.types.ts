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
          businessHours: Json
          city: string
          country: string
          createdAt: string
          description: string | null
          email: string
          id: string
          isActive: boolean
          name: string
          phone: string
          postalCode: string
          subscriptionTier: string
          type: string
          updatedAt: string
          userId: string | null
        }
        Insert: {
          acceptAppointmentsAutomatically?: boolean
          address: string
          businessHours: Json
          city: string
          country?: string
          createdAt?: string
          description?: string | null
          email: string
          id?: string
          isActive?: boolean
          name: string
          phone: string
          postalCode: string
          subscriptionTier?: string
          type: string
          updatedAt?: string
          userId?: string | null
        }
        Update: {
          acceptAppointmentsAutomatically?: boolean
          address?: string
          businessHours?: Json
          city?: string
          country?: string
          createdAt?: string
          description?: string | null
          email?: string
          id?: string
          isActive?: boolean
          name?: string
          phone?: string
          postalCode?: string
          subscriptionTier?: string
          type?: string
          updatedAt?: string
          userId?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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