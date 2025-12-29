import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, partnerInfo, settings } = await req.json();

    const businessContext = `
Business Information:
- Company Name: ${partnerInfo?.name || 'N/A'}
- Legal Name: ${partnerInfo?.legal_name || partnerInfo?.name || 'N/A'}
- Address: ${partnerInfo?.address || 'N/A'}
- City: ${partnerInfo?.city || 'N/A'}
- Country: ${partnerInfo?.country || 'Indonesia'}
- Contact Email: ${partnerInfo?.contact_email || 'N/A'}
- Contact Phone: ${partnerInfo?.contact_phone || 'N/A'}
- Website: ${partnerInfo?.website || 'N/A'}

Settings:
- Cancellation Deadline: ${settings?.cancellation_deadline_hours || 24} hours
- Cancellation Fee Type: ${settings?.cancellation_fee_type || 'percent'}
- Cancellation Fee Value: ${settings?.cancellation_fee_value || 10}%
- Refund Enabled: ${settings?.refund_enabled ? 'Yes' : 'No'}
- Deposit Required: ${settings?.deposit_enabled ? `Yes (min ${settings?.min_deposit_percent || 50}%)` : 'No'}
- Ticket Validity: ${settings?.ticket_validity_hours || 24} hours
- Tax & Service: ${settings?.tax_service_percent || 0}%
`;

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'booking') {
      systemPrompt = `You are a legal terms writer for a fast boat / ferry booking platform in Indonesia. 
Generate professional booking terms and conditions in English. 
The terms should be comprehensive, covering:
1. General information about the company as booking agent
2. Booking and payment terms
3. Confirmation and e-tickets
4. Changes and cancellations policy
5. Schedule changes by operator
6. Port fees
7. Check-in and boarding
8. Luggage policy
9. Liability disclaimer
10. Privacy
11. Governing law

Be professional but clear. Use plain language. Format with proper headings and numbered sections.`;

      userPrompt = `Generate comprehensive booking terms and conditions for this business:\n\n${businessContext}\n\nThe terms should reflect the actual settings configured (cancellation policies, deposit requirements, etc.).`;
    } else if (type === 'voucher') {
      systemPrompt = `You are a legal terms writer for a fast boat / ferry booking platform. 
Generate clear and concise voucher terms in English. 
Keep it brief - use bullet points. Cover:
- Voucher validity
- Exclusions
- Exchange policy
- Cancellation/refund based on the business settings
- Contact information`;

      userPrompt = `Generate voucher terms for this business:\n\n${businessContext}\n\nKeep it concise with bullet points. Reflect the actual cancellation and refund settings.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI Gateway error: ${error}`);
    }

    const data = await response.json();
    const generatedTerms = data.choices[0]?.message?.content || '';

    return new Response(JSON.stringify({ terms: generatedTerms }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating terms:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
