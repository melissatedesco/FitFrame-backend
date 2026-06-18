import Stripe from 'stripe'
import Subscription from '../models/subscriptionModel.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PLANS = {
    base:     { priceId: process.env.STRIPE_PRICE_BASE,     name: 'Base',     clients: 5,      price: '€29/mese' },
    pro:      { priceId: process.env.STRIPE_PRICE_PRO,      name: 'Pro',      clients: 15,     price: '€59/mese' },
    business: { priceId: process.env.STRIPE_PRICE_BUSINESS, name: 'Business', clients: '∞',    price: '€99/mese' },
}

// Restituisce i piani disponibili e lo stato attuale
export const getStatus = async (req, res, next) => {
    try {
        const sub = await Subscription.getByUserId(req.user.id)
        res.json({
            plans: PLANS,
            current: {
                status:      sub?.subscription_status || 'none',
                plan:        sub?.subscription_plan   || null,
                client_limit: sub?.client_limit       || 0,
                trial_ends_at: sub?.trial_ends_at     || null,
            }
        })
    } catch (e) { next(e) }
}

// Crea sessione Stripe Checkout
export const createCheckout = async (req, res, next) => {
    try {
        const { plan } = req.body
        if (!PLANS[plan]) return res.status(400).json({ message: 'Piano non valido. Scegli: base, pro, business.' })

        const sub = await Subscription.getByUserId(req.user.id)

        // Crea o recupera il customer Stripe
        let customerId = sub?.stripe_customer_id
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: req.user.email,
                name:  req.user.name,
                metadata: { user_id: String(req.user.id) },
            })
            customerId = customer.id
            await Subscription.setCustomerId(req.user.id, customerId)
        }

        const session = await stripe.checkout.sessions.create({
            customer:   customerId,
            mode:       'subscription',
            line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
            success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url:  `${process.env.FRONTEND_URL}/subscription/cancel`,
            subscription_data: {
                trial_period_days: 14,
                metadata: { user_id: String(req.user.id), plan },
            },
            metadata: { user_id: String(req.user.id), plan },
        })

        res.json({ url: session.url })
    } catch (e) { next(e) }
}

// Apre il Customer Portal (gestione/cancellazione abbonamento)
export const createPortal = async (req, res, next) => {
    try {
        const sub = await Subscription.getByUserId(req.user.id)
        if (!sub?.stripe_customer_id) {
            return res.status(400).json({ message: 'Nessun abbonamento attivo.' })
        }

        const session = await stripe.billingPortal.sessions.create({
            customer:   sub.stripe_customer_id,
            return_url: `${process.env.FRONTEND_URL}/subscription`,
        })

        res.json({ url: session.url })
    } catch (e) { next(e) }
}

// Webhook Stripe — riceve eventi (pagamenti, cancellazioni, ecc.)
export const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature']
    let event

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
        return res.status(400).send(`Webhook error: ${err.message}`)
    }

    try {
        switch (event.type) {

            case 'checkout.session.completed': {
                const session = event.data.object
                if (session.mode !== 'subscription') break
                const userId = session.metadata?.user_id
                const plan   = session.metadata?.plan
                if (!userId || !plan) break

                const stripeSub = await stripe.subscriptions.retrieve(session.subscription)
                await Subscription.activate(userId, {
                    subscriptionId: stripeSub.id,
                    plan,
                    status: stripeSub.status,
                })
                break
            }

            case 'customer.subscription.updated': {
                const stripeSub = event.data.object
                await Subscription.updateStatus(stripeSub.id, stripeSub.status)
                break
            }

            case 'customer.subscription.deleted': {
                const stripeSub = event.data.object
                await Subscription.cancel(stripeSub.id)
                break
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object
                if (invoice.subscription) {
                    await Subscription.updateStatus(invoice.subscription, 'past_due')
                }
                break
            }
        }

        res.json({ received: true })
    } catch (e) {
        console.error('[Webhook error]', e.message)
        res.status(500).json({ error: e.message })
    }
}
