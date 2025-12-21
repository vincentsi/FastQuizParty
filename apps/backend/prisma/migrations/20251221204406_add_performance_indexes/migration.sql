-- CreateIndex
CREATE INDEX "categories_slug_id_idx" ON "categories"("slug", "id");

-- CreateIndex
CREATE INDEX "game_players_gameId_score_idx" ON "game_players"("gameId", "score");

-- CreateIndex
CREATE INDEX "game_players_userId_joinedAt_idx" ON "game_players"("userId", "joinedAt");

-- CreateIndex
CREATE INDEX "games_quizId_status_idx" ON "games"("quizId", "status");

-- CreateIndex
CREATE INDEX "games_status_createdAt_idx" ON "games"("status", "createdAt");

-- CreateIndex
CREATE INDEX "player_answers_gamePlayerId_questionId_idx" ON "player_answers"("gamePlayerId", "questionId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_status_currentPeriodEnd_idx" ON "subscriptions"("userId", "status", "currentPeriodEnd");
