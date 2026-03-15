// Stakr Database Schema - Drizzle ORM
import { pgTable, uuid, varchar, text, decimal, integer, boolean, timestamp, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ================================
// USERS TABLE
// ================================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  avatarUrl: text('avatar_url'),
  credits: decimal('credits', { precision: 10, scale: 2 }).default('0.00').notNull(),
  trustScore: integer('trust_score').default(50).notNull(),
  verificationTier: varchar('verification_tier', { length: 20 }).default('manual').notNull(),
  challengesCompleted: integer('challenges_completed').default(0).notNull(),
  falseClaims: integer('false_claims').default(0).notNull(),
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  premiumSubscription: boolean('premium_subscription').default(false).notNull(),
  premiumExpiresAt: timestamp('premium_expires_at'),
  emailVerified: timestamp('email_verified'),
  passwordHash: text('password_hash'),
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  // Dev Access Fields
  isDev: boolean('is_dev').default(false).notNull(),
  devModeEnabled: boolean('dev_mode_enabled').default(false).notNull(),
  devAccessGrantedBy: uuid('dev_access_granted_by').references(() => users.id),
  devAccessGrantedAt: timestamp('dev_access_granted_at'),
  // Stripe Connect for payouts
  stripeConnectAccountId: text('stripe_connect_account_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  usernameIdx: uniqueIndex('users_username_idx').on(table.username),
  trustScoreIdx: index('users_trust_score_idx').on(table.trustScore),
  premiumIdx: index('users_premium_idx').on(table.premiumSubscription),
  devIdx: index('users_dev_idx').on(table.isDev),
  stripeConnectIdx: index('users_stripe_connect_account_idx').on(table.stripeConnectAccountId),
}))

// ================================
// CHALLENGES TABLE
// ================================
export const challenges = pgTable('challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  longDescription: text('long_description'),
  category: varchar('category', { length: 100 }).notNull(),
  duration: varchar('duration', { length: 50 }).notNull(),
  difficulty: varchar('difficulty', { length: 20 }).notNull(),
  minStake: decimal('min_stake', { precision: 8, scale: 2 }).notNull(),
  maxStake: decimal('max_stake', { precision: 8, scale: 2 }).notNull(),
  hostId: uuid('host_id').references(() => users.id),
  hostContribution: decimal('host_contribution', { precision: 8, scale: 2 }).default('0.00').notNull(),
  entryFeePercentage: decimal('entry_fee_percentage', { precision: 4, scale: 2 }).default('5.00').notNull(),
  failedStakeCut: decimal('failed_stake_cut', { precision: 4, scale: 2 }).default('20.00').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  verificationType: varchar('verification_type', { length: 20 }).default('manual').notNull(),
  proofRequirements: jsonb('proof_requirements'),
  rules: text('rules').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('challenges_status_idx').on(table.status),
  startDateIdx: index('challenges_start_date_idx').on(table.startDate),
  categoryIdx: index('challenges_category_idx').on(table.category),
  hostIdx: index('challenges_host_idx').on(table.hostId),
}))

// ================================
// CHALLENGE PARTICIPANTS TABLE
// ================================
export const challengeParticipants = pgTable('challenge_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').references(() => challenges.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  stakeAmount: decimal('stake_amount', { precision: 8, scale: 2 }).notNull(),
  entryFeePaid: decimal('entry_fee_paid', { precision: 8, scale: 2 }).notNull(),
  insurancePurchased: boolean('insurance_purchased').default(false).notNull(),
  insuranceFeePaid: decimal('insurance_fee_paid', { precision: 4, scale: 2 }).default('0.00').notNull(),
  completionStatus: varchar('completion_status', { length: 20 }).default('active').notNull(),
  proofSubmitted: boolean('proof_submitted').default(false).notNull(),
  verificationStatus: varchar('verification_status', { length: 20 }).default('pending').notNull(),
  rewardEarned: decimal('reward_earned', { precision: 8, scale: 2 }).default('0.00').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  uniqueParticipant: uniqueIndex('unique_participant_idx').on(table.challengeId, table.userId),
  challengeIdx: index('participants_challenge_idx').on(table.challengeId),
  userIdx: index('participants_user_idx').on(table.userId),
  statusIdx: index('participants_status_idx').on(table.completionStatus),
}))

// ================================
// PROOF SUBMISSIONS TABLE
// ================================
export const proofSubmissions = pgTable('proof_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  participantId: uuid('participant_id').references(() => challengeParticipants.id, { onDelete: 'cascade' }).notNull(),
  challengeId: uuid('challenge_id').references(() => challenges.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  submissionType: varchar('submission_type', { length: 20 }).notNull(),
  fileUrl: text('file_url'),
  textContent: text('text_content'),
  metadata: jsonb('metadata'),
  aiVerificationScore: decimal('ai_verification_score', { precision: 4, scale: 2 }),
  adminNotes: text('admin_notes'),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
}, (table) => ({
  participantIdx: index('proof_participant_idx').on(table.participantId),
  challengeIdx: index('proof_challenge_idx').on(table.challengeId),
  userIdx: index('proof_user_idx').on(table.userId),
  statusIdx: index('proof_status_idx').on(table.status),
}))

// ================================
// TRANSACTIONS TABLE
// ================================
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  challengeId: uuid('challenge_id').references(() => challenges.id),
  transactionType: varchar('transaction_type', { length: 30 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  platformRevenue: decimal('platform_revenue', { precision: 10, scale: 2 }).default('0.00').notNull(),
  stripePaymentId: text('stripe_payment_id'),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('transactions_user_idx').on(table.userId),
  typeIdx: index('transactions_type_idx').on(table.transactionType),
  statusIdx: index('transactions_status_idx').on(table.status),
  stripeIdx: index('transactions_stripe_idx').on(table.stripePaymentId),
}))

// ================================
// CREDIT TRANSACTIONS TABLE
// ================================
export const creditTransactions = pgTable('credit_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  transactionType: varchar('transaction_type', { length: 30 }).notNull(),
  relatedChallengeId: uuid('related_challenge_id').references(() => challenges.id),
  relatedTransactionId: uuid('related_transaction_id').references(() => transactions.id),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('credit_transactions_user_idx').on(table.userId),
  typeIdx: index('credit_transactions_type_idx').on(table.transactionType),
}))

// ================================
// NOTIFICATIONS TABLE
// ================================
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 30 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  actionUrl: text('action_url'),
  read: boolean('read').default(false).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('notifications_user_idx').on(table.userId),
  readIdx: index('notifications_read_idx').on(table.userId, table.read),
  typeIdx: index('notifications_type_idx').on(table.type),
}))

// ================================
// INSURANCE CLAIMS TABLE
// ================================
export const insuranceClaims = pgTable('insurance_claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  participantId: uuid('participant_id').references(() => challengeParticipants.id).notNull(),
  claimReason: text('claim_reason').notNull(),
  supportingEvidence: jsonb('supporting_evidence'),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  claimAmount: decimal('claim_amount', { precision: 8, scale: 2 }),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  participantIdx: index('insurance_participant_idx').on(table.participantId),
  statusIdx: index('insurance_status_idx').on(table.status),
}))

// ================================
// PLATFORM REVENUE TABLE
// ================================
export const platformRevenue = pgTable('platform_revenue', {
  id: uuid('id').primaryKey().defaultRandom(),
  revenueType: varchar('revenue_type', { length: 30 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  challengeId: uuid('challenge_id').references(() => challenges.id),
  userId: uuid('user_id').references(() => users.id),
  transactionId: uuid('transaction_id').references(() => transactions.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  typeIdx: index('revenue_type_idx').on(table.revenueType),
  dateIdx: index('revenue_date_idx').on(table.createdAt),
}))

// ================================
// ADMIN ACTIONS TABLE (for transparency)
// ================================
export const adminActions = pgTable('admin_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id').references(() => users.id).notNull(),
  actionType: varchar('action_type', { length: 50 }).notNull(),
  targetUserId: uuid('target_user_id').references(() => users.id),
  targetChallengeId: uuid('target_challenge_id').references(() => challenges.id),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  adminIdx: index('admin_actions_admin_idx').on(table.adminId),
  targetUserIdx: index('admin_actions_target_user_idx').on(table.targetUserId),
  actionTypeIdx: index('admin_actions_type_idx').on(table.actionType),
}))

// ================================
// PREMIUM FEATURES TABLES
// ================================
export const hostCustomRewards = pgTable('host_custom_rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').references(() => challenges.id, { onDelete: 'cascade' }).notNull(),
  hostId: uuid('host_id').references(() => users.id).notNull(),
  rewardType: varchar('reward_type', { length: 20 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  descriptiveValue: text('descriptive_value'),
  premiumOnly: boolean('premium_only').default(false).notNull(),
  minimumTrustScore: integer('minimum_trust_score'),
  completionRequirement: varchar('completion_requirement', { length: 20 }).default('all').notNull(),
  deliveryMethod: varchar('delivery_method', { length: 20 }).default('platform').notNull(),
  maxRecipients: integer('max_recipients'),
  recipientsCount: integer('recipients_count').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  challengeIdx: index('custom_rewards_challenge_idx').on(table.challengeId),
  hostIdx: index('custom_rewards_host_idx').on(table.hostId),
  premiumIdx: index('custom_rewards_premium_idx').on(table.premiumOnly),
}))

// ================================
// RELATIONSHIPS
// ================================
export const usersRelations = relations(users, ({ many }) => ({
  challenges: many(challenges),
  participants: many(challengeParticipants),
  transactions: many(transactions),
  notifications: many(notifications),
  proofSubmissions: many(proofSubmissions),
  adminActions: many(adminActions),
  customRewards: many(hostCustomRewards),
}))

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  host: one(users, {
    fields: [challenges.hostId],
    references: [users.id],
  }),
  participants: many(challengeParticipants),
  proofSubmissions: many(proofSubmissions),
  transactions: many(transactions),
  customRewards: many(hostCustomRewards),
}))

export const challengeParticipantsRelations = relations(challengeParticipants, ({ one, many }) => ({
  challenge: one(challenges, {
    fields: [challengeParticipants.challengeId],
    references: [challenges.id],
  }),
  user: one(users, {
    fields: [challengeParticipants.userId],
    references: [users.id],
  }),
  proofSubmissions: many(proofSubmissions),
  insuranceClaims: many(insuranceClaims),
}))

export const proofSubmissionsRelations = relations(proofSubmissions, ({ one }) => ({
  participant: one(challengeParticipants, {
    fields: [proofSubmissions.participantId],
    references: [challengeParticipants.id],
  }),
  challenge: one(challenges, {
    fields: [proofSubmissions.challengeId],
    references: [challenges.id],
  }),
  user: one(users, {
    fields: [proofSubmissions.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [proofSubmissions.reviewedBy],
    references: [users.id],
  }),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  challenge: one(challenges, {
    fields: [transactions.challengeId],
    references: [challenges.id],
  }),
}))

// ================================
// CREATORS TABLE
// ================================
export const creators = pgTable('creators', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  avatar: text('avatar'),
  bio: text('bio'),
  followers: integer('followers').default(0).notNull(),
  challengesCreated: integer('challenges_created').default(0).notNull(),
  successRate: integer('success_rate').default(0).notNull(),
  totalEarnings: decimal('total_earnings', { precision: 10, scale: 2 }).default('0.00').notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  categories: varchar('categories', { length: 100 }).array().default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('creators_user_idx').on(table.userId),
  usernameIdx: uniqueIndex('creators_username_idx').on(table.username),
  verifiedIdx: index('creators_verified_idx').on(table.isVerified),
}))

// ================================
// BRANDS TABLE
// ================================
export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  logo: text('logo'),
  description: text('description'),
  industry: varchar('industry', { length: 100 }).notNull(),
  followers: integer('followers').default(0).notNull(),
  challengesSponsored: integer('challenges_sponsored').default(0).notNull(),
  totalRewards: decimal('total_rewards', { precision: 10, scale: 2 }).default('0.00').notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  categories: varchar('categories', { length: 100 }).array().default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  industryIdx: index('brands_industry_idx').on(table.industry),
  verifiedIdx: index('brands_verified_idx').on(table.isVerified),
}))

// ================================
// EXPORT TABLE TYPES
// ================================
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Challenge = typeof challenges.$inferSelect
export type NewChallenge = typeof challenges.$inferInsert
export type ChallengeParticipant = typeof challengeParticipants.$inferSelect
export type NewChallengeParticipant = typeof challengeParticipants.$inferInsert
export type ProofSubmission = typeof proofSubmissions.$inferSelect
export type NewProofSubmission = typeof proofSubmissions.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type Creator = typeof creators.$inferSelect
export type NewCreator = typeof creators.$inferInsert
export type Brand = typeof brands.$inferSelect
export type NewBrand = typeof brands.$inferInsert
