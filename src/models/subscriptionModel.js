import db from '../config/db.js'

const PLAN_LIMITS = {
    base:     5,
    pro:      15,
    business: 999999,
}

const Subscription = {

    getByUserId: async (userId) => {
        const [[row]] = await db.execute(
            `SELECT stripe_customer_id, subscription_id, subscription_status,
                    subscription_plan, client_limit, trial_ends_at
             FROM users WHERE id = ?`,
            [userId]
        )
        return row || null
    },

    setCustomerId: async (userId, customerId) => {
        await db.execute(
            `UPDATE users SET stripe_customer_id = ? WHERE id = ?`,
            [customerId, userId]
        )
    },

    activate: async (userId, { subscriptionId, plan, status }) => {
        const limit = PLAN_LIMITS[plan] ?? 0
        await db.execute(
            `UPDATE users
             SET subscription_id     = ?,
                 subscription_status = ?,
                 subscription_plan   = ?,
                 client_limit        = ?,
                 role                = 'trainer'
             WHERE id = ?`,
            [subscriptionId, status, plan, limit, userId]
        )
    },

    updateStatus: async (subscriptionId, status) => {
        await db.execute(
            `UPDATE users SET subscription_status = ? WHERE subscription_id = ?`,
            [status, subscriptionId]
        )
    },

    cancel: async (subscriptionId) => {
        await db.execute(
            `UPDATE users
             SET subscription_status = 'canceled',
                 client_limit        = 0
             WHERE subscription_id = ?`,
            [subscriptionId]
        )
    },

    findByCustomerId: async (customerId) => {
        const [[row]] = await db.execute(
            `SELECT id FROM users WHERE stripe_customer_id = ?`,
            [customerId]
        )
        return row || null
    },

    findBySubscriptionId: async (subscriptionId) => {
        const [[row]] = await db.execute(
            `SELECT id FROM users WHERE subscription_id = ?`,
            [subscriptionId]
        )
        return row || null
    },

    PLAN_LIMITS,
}

export default Subscription
