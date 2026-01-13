import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Events we care about for payment processing
const RELEVANT_EVENTS = [
  'CHECKOUT.ORDER.APPROVED',
  'CHECKOUT.ORDER.COMPLETED',
  'PAYMENT.CAPTURE.COMPLETED',
  'PAYMENT.CAPTURE.DENIED',
  'PAYMENT.CAPTURE.REFUNDED',
  'PAYMENT.CAPTURE.REVERSED',
]

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const eventType = payload.event_type

    console.log(`PayPal Webhook received: ${eventType}`)
    console.log('Payload:', JSON.stringify(payload, null, 2))

    // Filter: only process relevant events
    if (!RELEVANT_EVENTS.includes(eventType)) {
      console.log(`Ignoring event type: ${eventType}`)
      return new Response(
        JSON.stringify({ success: true, message: `Event ${eventType} ignored` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Extract relevant data from PayPal payload
    const resource = payload.resource
    const orderId = resource?.id || resource?.supplementary_data?.related_ids?.order_id
    const customId = resource?.custom_id || resource?.purchase_units?.[0]?.custom_id
    const captureId = resource?.id
    const amount = resource?.amount?.value || resource?.purchase_units?.[0]?.amount?.value
    const currency = resource?.amount?.currency_code || resource?.purchase_units?.[0]?.amount?.currency_code

    console.log(`Processing ${eventType} - Order: ${orderId}, Custom ID: ${customId}, Amount: ${amount} ${currency}`)

    // Handle different event types
    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED':
      case 'CHECKOUT.ORDER.COMPLETED':
        // Customer approved the payment, we can now capture it
        console.log(`Order approved/completed: ${orderId}`)
        
        if (customId) {
          // customId contains our booking_id
          const { error: updateError } = await supabase
            .from('payments')
            .update({ 
              status: 'pending',
              provider_reference: orderId 
            })
            .eq('booking_id', customId)

          if (updateError) {
            console.error('Error updating payment:', updateError)
          }
        }
        break

      case 'PAYMENT.CAPTURE.COMPLETED':
        // Payment successfully captured
        console.log(`Payment captured: ${captureId}`)
        
        if (customId) {
          // Update payment status to completed
          const { error: paymentError } = await supabase
            .from('payments')
            .update({ 
              status: 'completed',
              paid_at: new Date().toISOString(),
              provider_reference: captureId
            })
            .eq('booking_id', customId)

          if (paymentError) {
            console.error('Error updating payment:', paymentError)
          } else {
            // Also update booking status to confirmed
            const { error: bookingError } = await supabase
              .from('bookings')
              .update({ status: 'confirmed' })
              .eq('id', customId)

            if (bookingError) {
              console.error('Error updating booking:', bookingError)
            }
          }
        }
        break

      case 'PAYMENT.CAPTURE.DENIED':
        console.log(`Payment denied: ${captureId}`)
        
        if (customId) {
          const { error } = await supabase
            .from('payments')
            .update({ status: 'failed' })
            .eq('booking_id', customId)

          if (error) {
            console.error('Error updating payment:', error)
          }
        }
        break

      case 'PAYMENT.CAPTURE.REFUNDED':
      case 'PAYMENT.CAPTURE.REVERSED':
        console.log(`Payment refunded/reversed: ${captureId}`)
        
        if (customId) {
          const { error: paymentError } = await supabase
            .from('payments')
            .update({ status: 'refunded' })
            .eq('booking_id', customId)

          if (paymentError) {
            console.error('Error updating payment:', paymentError)
          }

          const { error: bookingError } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', customId)

          if (bookingError) {
            console.error('Error updating booking:', bookingError)
          }
        }
        break
    }

    return new Response(
      JSON.stringify({ success: true, event: eventType }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('PayPal Webhook Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
