-- CreateEnum
CREATE TYPE "VehicleChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "hasPendingChange" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "vehiclePhoto" TEXT,
ADD COLUMN     "year" TEXT;

-- CreateTable
CREATE TABLE "VehicleChangeRequest" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "newPlate" TEXT,
    "newModel" TEXT,
    "newBrand" TEXT,
    "newYear" TEXT,
    "newColor" TEXT,
    "newCapacityKg" INTEGER,
    "newCapacityM3" DOUBLE PRECISION,
    "newDocuments" JSONB,
    "newVehiclePhoto" TEXT,
    "status" "VehicleChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleChangeRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VehicleChangeRequest" ADD CONSTRAINT "VehicleChangeRequest_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleChangeRequest" ADD CONSTRAINT "VehicleChangeRequest_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
