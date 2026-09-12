-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "industry" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "marketCap" REAL,
    "peRatio" REAL,
    "pbRatio" REAL,
    "dividendYield" REAL,
    "beta" REAL,
    "fiftyTwoWeekHigh" REAL,
    "fiftyTwoWeekLow" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stockId" TEXT NOT NULL,
    "persona" TEXT NOT NULL,
    "signal" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "confidenceScore" INTEGER NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "bullCase" TEXT NOT NULL,
    "bearCase" TEXT NOT NULL,
    "keyCatalyst" TEXT,
    "priceTarget" REAL,
    "volatilityNote" TEXT,
    "technicalSignal" TEXT,
    "reasoningChain" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Analysis_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvestmentMemo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stockId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thesis" TEXT NOT NULL,
    "valuation" TEXT NOT NULL,
    "peerAnalysis" TEXT NOT NULL,
    "riskAssessment" TEXT NOT NULL,
    "catalysts" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "targetPrice" REAL,
    "timeHorizon" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "personas" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvestmentMemo_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PriceData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stockId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "open" REAL NOT NULL,
    "high" REAL NOT NULL,
    "low" REAL NOT NULL,
    "close" REAL NOT NULL,
    "volume" INTEGER NOT NULL,
    "adjClose" REAL,
    "sma20" REAL,
    "sma50" REAL,
    "sma200" REAL,
    "rsi14" REAL,
    "macd" REAL,
    "macdSignal" REAL,
    "bollingerUpper" REAL,
    "bollingerLower" REAL,
    CONSTRAINT "PriceData_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EarningsEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stockId" TEXT NOT NULL,
    "reportDate" DATETIME NOT NULL,
    "quarter" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "epsEstimate" REAL,
    "epsActual" REAL,
    "surprise" REAL,
    "revenueEstimate" REAL,
    "revenueActual" REAL,
    "revenueSurprise" REAL,
    "priceMovement" REAL,
    "aiReaction" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EarningsEvent_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OpportunityScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stockId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overallScore" INTEGER NOT NULL,
    "valueScore" INTEGER NOT NULL,
    "growthScore" INTEGER NOT NULL,
    "momentumScore" INTEGER NOT NULL,
    "qualityScore" INTEGER NOT NULL,
    "safetyScore" INTEGER NOT NULL,
    "reason" TEXT,
    "period" TEXT NOT NULL,
    CONSTRAINT "OpportunityScore_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tickers" TEXT NOT NULL,
    "strategy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Stock_ticker_key" ON "Stock"("ticker");

-- CreateIndex
CREATE INDEX "Analysis_stockId_persona_idx" ON "Analysis"("stockId", "persona");

-- CreateIndex
CREATE INDEX "Analysis_createdAt_idx" ON "Analysis"("createdAt");

-- CreateIndex
CREATE INDEX "InvestmentMemo_stockId_idx" ON "InvestmentMemo"("stockId");

-- CreateIndex
CREATE INDEX "InvestmentMemo_createdAt_idx" ON "InvestmentMemo"("createdAt");

-- CreateIndex
CREATE INDEX "PriceData_stockId_date_idx" ON "PriceData"("stockId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PriceData_stockId_date_key" ON "PriceData"("stockId", "date");

-- CreateIndex
CREATE INDEX "EarningsEvent_stockId_reportDate_idx" ON "EarningsEvent"("stockId", "reportDate");

-- CreateIndex
CREATE INDEX "OpportunityScore_date_period_idx" ON "OpportunityScore"("date", "period");

-- CreateIndex
CREATE INDEX "OpportunityScore_stockId_date_idx" ON "OpportunityScore"("stockId", "date");
