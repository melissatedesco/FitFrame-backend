import Subscription from '../models/subscriptionModel.js'

export default async (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Non autenticato.' })

    // admin bypassa tutto
    if (req.user.role === 'admin') return next()

    if (req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Accesso negato. Riservato ai trainer.' })
    }

    // verifica abbonamento attivo
    const sub = await Subscription.getByUserId(req.user.id).catch(() => null)
    const active = sub && ['active', 'trialing'].includes(sub.subscription_status)
    if (!active) {
        return res.status(403).json({
            message: 'Abbonamento non attivo. Vai su /api/subscriptions/checkout per sottoscrivere un piano.',
            code: 'SUBSCRIPTION_REQUIRED',
        })
    }

    next()
}
