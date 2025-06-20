-- Create Business table
CREATE TABLE IF NOT EXISTS "Business" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'Deutschland',
  "description" TEXT,
  "businessHours" JSONB NOT NULL,
  "subscriptionTier" TEXT NOT NULL DEFAULT 'basic',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS "Business_email_key" ON "Business"("email");
CREATE INDEX IF NOT EXISTS "Business_email_idx" ON "Business"("email");

-- Create Service table
CREATE TABLE IF NOT EXISTS "Service" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "businessId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "duration" INTEGER NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "bufferBefore" INTEGER NOT NULL DEFAULT 0,
  "bufferAfter" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Service_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Service_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Service_businessId_idx" ON "Service"("businessId");

-- Create Employee table
CREATE TABLE IF NOT EXISTS "Employee" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "businessId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "role" TEXT NOT NULL DEFAULT 'Mitarbeiter',
  "canPerformServices" BOOLEAN NOT NULL DEFAULT true,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "workingHours" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Employee_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Employee_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Employee_email_key" ON "Employee"("email");
CREATE INDEX IF NOT EXISTS "Employee_businessId_idx" ON "Employee"("businessId");
CREATE INDEX IF NOT EXISTS "Employee_email_idx" ON "Employee"("email");

-- Create EmployeeService table
CREATE TABLE IF NOT EXISTS "EmployeeService" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "employeeId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  CONSTRAINT "EmployeeService_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmployeeService_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE,
  CONSTRAINT "EmployeeService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "EmployeeService_employeeId_serviceId_key" ON "EmployeeService"("employeeId", "serviceId");
CREATE INDEX IF NOT EXISTS "EmployeeService_employeeId_idx" ON "EmployeeService"("employeeId");
CREATE INDEX IF NOT EXISTS "EmployeeService_serviceId_idx" ON "EmployeeService"("serviceId");

-- Create ScheduleException table
CREATE TABLE IF NOT EXISTS "ScheduleException" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "employeeId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "type" TEXT NOT NULL,
  "startTime" TEXT,
  "endTime" TEXT,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScheduleException_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ScheduleException_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ScheduleException_employeeId_date_idx" ON "ScheduleException"("employeeId", "date");

-- Create Customer table
CREATE TABLE IF NOT EXISTS "Customer" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "businessId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Customer_businessId_email_key" ON "Customer"("businessId", "email");
CREATE INDEX IF NOT EXISTS "Customer_businessId_idx" ON "Customer"("businessId");
CREATE INDEX IF NOT EXISTS "Customer_email_idx" ON "Customer"("email");

-- Create Appointment table
CREATE TABLE IF NOT EXISTS "Appointment" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "businessId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'confirmed',
  "notes" TEXT,
  "cancellationReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Appointment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE,
  CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT,
  CONSTRAINT "Appointment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT,
  CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "Appointment_businessId_startTime_idx" ON "Appointment"("businessId", "startTime");
CREATE INDEX IF NOT EXISTS "Appointment_employeeId_startTime_idx" ON "Appointment"("employeeId", "startTime");
CREATE INDEX IF NOT EXISTS "Appointment_customerId_idx" ON "Appointment"("customerId");
CREATE INDEX IF NOT EXISTS "Appointment_status_idx" ON "Appointment"("status");

-- Create update trigger for updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_Business_updated_at BEFORE UPDATE ON "Business" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_Service_updated_at BEFORE UPDATE ON "Service" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_Employee_updated_at BEFORE UPDATE ON "Employee" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ScheduleException_updated_at BEFORE UPDATE ON "ScheduleException" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_Customer_updated_at BEFORE UPDATE ON "Customer" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_Appointment_updated_at BEFORE UPDATE ON "Appointment" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();