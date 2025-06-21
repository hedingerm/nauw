// Temporary types until we generate from Supabase
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
      Business: {
        Row: {
          id: string
          name: string
          type: string
          email: string
          phone: string
          address: string
          city: string
          postalCode: string
          country: string
          description: string | null
          businessHours: Json
          isActive: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          email: string
          phone: string
          address: string
          city: string
          postalCode: string
          country?: string
          description?: string | null
          businessHours: Json
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          email?: string
          phone?: string
          address?: string
          city?: string
          postalCode?: string
          country?: string
          description?: string | null
          businessHours?: Json
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
      }
      Service: {
        Row: {
          id: string
          businessId: string
          name: string
          description: string | null
          duration: number
          price: string
          bufferBefore: number
          bufferAfter: number
          isActive: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          businessId: string
          name: string
          description?: string | null
          duration: number
          price: string
          bufferBefore?: number
          bufferAfter?: number
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          businessId?: string
          name?: string
          description?: string | null
          duration?: number
          price?: string
          bufferBefore?: number
          bufferAfter?: number
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
      }
      Employee: {
        Row: {
          id: string
          businessId: string
          email: string
          name: string
          phone: string | null
          role: string
          canPerformServices: boolean
          isActive: boolean
          workingHours: Json | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          businessId: string
          email: string
          name: string
          phone?: string | null
          role?: string
          canPerformServices?: boolean
          isActive?: boolean
          workingHours?: Json | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          businessId?: string
          email?: string
          name?: string
          phone?: string | null
          role?: string
          canPerformServices?: boolean
          isActive?: boolean
          workingHours?: Json | null
          createdAt?: string
          updatedAt?: string
        }
      }
      EmployeeService: {
        Row: {
          id: string
          employeeId: string
          serviceId: string
        }
        Insert: {
          id?: string
          employeeId: string
          serviceId: string
        }
        Update: {
          id?: string
          employeeId?: string
          serviceId?: string
        }
      }
      Customer: {
        Row: {
          id: string
          businessId: string
          email: string
          name: string
          phone: string
          notes: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          businessId: string
          email: string
          name: string
          phone: string
          notes?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          businessId?: string
          email?: string
          name?: string
          phone?: string
          notes?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      Appointment: {
        Row: {
          id: string
          businessId: string
          serviceId: string
          employeeId: string
          customerId: string
          startTime: string
          endTime: string
          status: string
          notes: string | null
          cancellationReason: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          businessId: string
          serviceId: string
          employeeId: string
          customerId: string
          startTime: string
          endTime: string
          status?: string
          notes?: string | null
          cancellationReason?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          businessId?: string
          serviceId?: string
          employeeId?: string
          customerId?: string
          startTime?: string
          endTime?: string
          status?: string
          notes?: string | null
          cancellationReason?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
    }
  }
}