import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')!
const WEBHOOK_SECRET = Deno.env.get('NOTIFY_WORKERS_SECRET')

async function sendSMS(to: string, body: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: to,
      From: TWILIO_PHONE_NUMBER,
      Body: body,
    }),
  })
  return response.json()
}

serve(async (req) => {
  if (WEBHOOK_SECRET && req.headers.get('x-shiftpay-secret') !== WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 401,
    })
  }

  const { record } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get restaurant name
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name')
    .eq('id', record.restaurant_id)
    .single()

  // Find matching workers (same role + same city, with phone numbers)
  const { data: workers } = await supabase
    .from('workers')
    .select('id, profiles(phone)')
    .eq('city', record.city)

  const matchingWorkers = await supabase
    .from('worker_roles')
    .select('worker_id')
    .eq('role', record.role)
    .in('worker_id', (workers || []).map(w => w.id))

  let notifiedCount = 0
  const skippedCount = { rateLimited: 0, missingPhone: 0 }
  const baseUrl = Deno.env.get('APP_URL') || 'https://shiftpay.vercel.app'
  const today = new Date().toISOString().slice(0, 10)

  for (const match of matchingWorkers.data || []) {
    const worker = workers?.find(w => w.id === match.worker_id)
    const phone = worker?.profiles?.phone
    if (!phone) {
      skippedCount.missingPhone++
      continue
    }

    const { count } = await supabase
      .from('sms_send_log')
      .select('*', { count: 'exact', head: true })
      .eq('worker_id', match.worker_id)
      .gte('created_at', `${today}T00:00:00.000Z`)

    if ((count || 0) >= 10) {
      skippedCount.rateLimited++
      continue
    }

    const message = record.is_urgent
      ? `🔥 Urgent: ${record.role} shift at ${restaurant?.name || 'a restaurant'} on ${record.date}. $${record.pay_rate}/hr. Claim now: ${baseUrl}/jobs/${record.id}`
      : `New ${record.role} opening at ${restaurant?.name || 'a restaurant'} in ${record.city}. Details: ${baseUrl}/jobs/${record.id}`

    try {
      await sendSMS(phone, message)
      await supabase.from('sms_send_log').insert({
        worker_id: match.worker_id,
        shift_id: record.id,
        phone,
      })
      notifiedCount++
    } catch (err) {
      console.error(`Failed to send SMS to worker ${match.worker_id}:`, err)
    }
  }

  return new Response(JSON.stringify({ notified: notifiedCount, skipped: skippedCount }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})
