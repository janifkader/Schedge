-- CreateTable
CREATE TABLE "User" (
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "refresh_token" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "sched_id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("sched_id")
);

-- CreateTable
CREATE TABLE "TeamSchedule" (
    "sched_id" TEXT NOT NULL,
    "owner_email" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,

    CONSTRAINT "TeamSchedule_pkey" PRIMARY KEY ("sched_id")
);

-- CreateTable
CREATE TABLE "Request" (
    "request_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "sender_email" TEXT NOT NULL,
    "receiver_email" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "Team" (
    "team_id" TEXT NOT NULL,
    "team_name" TEXT NOT NULL,
    "leader_email" TEXT NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("team_id")
);

-- CreateTable
CREATE TABLE "Event" (
    "event_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "weight" INTEGER NOT NULL,
    "cycle" TEXT NOT NULL,
    "span" TIMESTAMP(3) NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "reminded" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "Participates" (
    "participation_id" TEXT NOT NULL,
    "user_email" TEXT,
    "team_id" TEXT,
    "event_id" TEXT NOT NULL,

    CONSTRAINT "Participates_pkey" PRIMARY KEY ("participation_id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "user_email" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("user_email","team_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_refresh_token_key" ON "User"("refresh_token");

-- CreateIndex
CREATE UNIQUE INDEX "User_verification_token_key" ON "User"("verification_token");

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_user_email_key" ON "Schedule"("user_email");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSchedule_team_id_key" ON "TeamSchedule"("team_id");

-- CreateIndex
CREATE INDEX "Event_start_time_idx" ON "Event"("start_time");

-- CreateIndex
CREATE INDEX "Event_schedule_id_idx" ON "Event"("schedule_id");

-- CreateIndex
CREATE UNIQUE INDEX "Participates_user_email_event_id_key" ON "Participates"("user_email", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "Participates_team_id_event_id_key" ON "Participates"("team_id", "event_id");

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSchedule" ADD CONSTRAINT "TeamSchedule_owner_email_fkey" FOREIGN KEY ("owner_email") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSchedule" ADD CONSTRAINT "TeamSchedule_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_sender_email_fkey" FOREIGN KEY ("sender_email") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_receiver_email_fkey" FOREIGN KEY ("receiver_email") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_leader_email_fkey" FOREIGN KEY ("leader_email") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participates" ADD CONSTRAINT "Participates_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "User"("email") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participates" ADD CONSTRAINT "Participates_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("team_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participates" ADD CONSTRAINT "Participates_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;
