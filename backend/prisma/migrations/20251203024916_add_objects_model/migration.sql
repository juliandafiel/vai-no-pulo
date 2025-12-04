-- CreateTable
CREATE TABLE "Object" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "brand" TEXT,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "depth" DOUBLE PRECISION,
    "declaredValue" DOUBLE PRECISION,
    "isFragile" BOOLEAN NOT NULL DEFAULT false,
    "requiresRefrigeration" BOOLEAN NOT NULL DEFAULT false,
    "requiresSpecialCare" BOOLEAN NOT NULL DEFAULT false,
    "specialCareNotes" TEXT,
    "photos" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Object_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Object" ADD CONSTRAINT "Object_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
