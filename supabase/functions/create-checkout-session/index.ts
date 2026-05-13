import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

const appUrl = Deno.env.get('APP_URL') || 'https://shiftpay.vercel.app'

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'Missing authorization' }, 401)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: userResult, error: userError } = await supabase.auth.getUser()
  if (userError || !userResult.user) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('id, name')
    .eq('profile_id', userResult.user.id)
    .single()

  if (restaurantError || !restaurant) {
    return json({ error: 'Restaurant profile required' }, 403)
  }

  const body = await req.json().catch(() => ({}))
  const type = body.type

  if (type === 'subscription') {
    const priceId = Deno.env.get('STRIPE_PRO_PRICE_ID')
    if (!priceId) return json({ error: 'Stripe Pro price is not configured' }, 500)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userResult.user.email || undefined,
      success_url: `${appUrl}/dashboard/restaurant?checkout=success`,
      cancel_url: `${appUrl}/dashboard/restaurant?checkout=cancelled`,
      metadata: {
        restaurant_id: restaurant.id,
        type: 'subscription',
      },
      subscription_data: {
        metadata: {
          restaurant_id: restaurant.id,
        },
      },
    })

    return json({ url: session.url })
  }

  if (type === 'invoice') {
    const invoiceId = body.invoiceId
    if (typeof invoiceId !== 'string') {
      return json({ error: 'invoiceId is required' }, 400)
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, amount, status, restaurant_id, shifts(role, date)')
      .eq('id', invoiceId)
      .eq('restaurant_id', restaurant.id)
      .single()

    if (invoiceError || !invoice) {
      return json({ error: 'Invoice not found' }, 404)
    }
    if (invoice.status === 'paid') {
      return json({ error: 'Invoice is already paid' }, 409)
    }

    const shift = Array.isArray(invoice.shifts) ? invoice.shifts[0] : invoice.shifts
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `ShiftPay fill fee${shift?.role ? `: ${shift.role}` : ''}`,
              description: shift?.date ? `Shift date: ${shift.date}` : undefined,
            },
            unit_amount: invoice.amount,
          },
          quantity: 1,
        },
      ],
      customer_email: userResult.user.email || undefined,
      success_url: `${appUrl}/dashboard/restaurant?checkout=success`,
      cancel_url: `${appUrl}/dashboard/restaurant?checkout=cancelled`,
      metadata: {
        invoice_id: invoice.id,
        restaurant_id: restaurant.id,
        type: 'invoice',
      },
    })

    return json({ url: session.url })
  }

  return json({ error: 'Unsupported checkout type' }, 400)
})
