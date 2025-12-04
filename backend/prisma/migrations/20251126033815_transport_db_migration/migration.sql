/*
  Warnings:

  - Added the required column `updatedAt` to the `Trip` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "availableCapacityKg" DOUBLE PRECISION,
ADD COLUMN     "availableSeats" INTEGER,
ADD COLUMN     "distanceKm" DOUBLE PRECISION,
ADD COLUMN     "durationMinutes" INTEGER,
ADD COLUMN     "estimatedArrival" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "pricePerKm" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
