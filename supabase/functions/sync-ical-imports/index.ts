import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IcalImport {
  id: string;
  accommodation_id: string;
  partner_id: string;
  platform_name: string;
  ical_url: string;
}

interface ParsedEvent {
  startDate: string;
  endDate: string;
}

function parseIcalContent(icsText: string): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  const lines = icsText.replace(/\r\n /g, '').split(/\r?\n/);

  let inEvent = false;
  let dtstart = '';
  let dtend = '';

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      dtstart = '';
      dtend = '';
    } else if (line === 'END:VEVENT') {
      if (inEvent && dtstart) {
        // If no DTEND, assume 1 day event
        if (!dtend) {
          const d = parseIcalDate(dtstart);
          if (d) {
            const next = new Date(d + 'T00:00:00Z');
            next.setUTCDate(next.getUTCDate() + 1);
            dtend = next.toISOString().split('T')[0].replace(/-/g, '');
          }
        }
        const start = parseIcalDate(dtstart);
        const end = parseIcalDate(dtend);
        if (start && end) {
          events.push({ startDate: start, endDate: end });
        }
      }
      inEvent = false;
    } else if (inEvent) {
      if (line.startsWith('DTSTART')) {
        const val = line.split(':').pop() || '';
        dtstart = val.trim();
      } else if (line.startsWith('DTEND')) {
        const val = line.split(':').pop() || '';
        dtend = val.trim();
      }
    }
  }

  return events;
}

function parseIcalDate(val: string): string | null {
  // Format: YYYYMMDD or YYYYMMDDTHHmmssZ
  const dateOnly = val.replace(/T.*$/, '');
  if (dateOnly.length !== 8) return null;
  const y = dateOnly.substring(0, 4);
  const m = dateOnly.substring(4, 6);
  const d = dateOnly.substring(6, 8);
  return `${y}-${m}-${d}`;
}

function getDatesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start + 'T00:00:00Z');
  const endDate = new Date(end + 'T00:00:00Z');

  while (current < endDate) {
    dates.push(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function mapPlatformToSource(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'airbnb': return 'airbnb';
    case 'booking.com': return 'booking';
    default: return 'other';
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Optionally filter by accommodation_id
    let body: { accommodation_id?: string } = {};
    try {
      body = await req.json();
    } catch {
      // no body is fine
    }

    let query = supabase
      .from('accommodation_ical_imports')
      .select('*')
      .eq('is_active', true);

    if (body.accommodation_id) {
      query = query.eq('accommodation_id', body.accommodation_id);
    }

    const { data: imports, error: importError } = await query;
    if (importError) throw importError;

    const results: { id: string; status: string; error?: string }[] = [];

    for (const imp of (imports || []) as IcalImport[]) {
      try {
        // Fetch external iCal
        const response = await fetch(imp.ical_url, {
          headers: { 'User-Agent': 'Sribooking/1.0' },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const icsText = await response.text();
        const events = parseIcalContent(icsText);

        const source = mapPlatformToSource(imp.platform_name);

        // Delete old entries from this source for this accommodation
        const { error: deleteError } = await supabase
          .from('accommodation_calendar')
          .delete()
          .eq('accommodation_id', imp.accommodation_id)
          .eq('source', source);

        if (deleteError) throw deleteError;

        // Insert new dates
        const allDates: string[] = [];
        for (const event of events) {
          const dates = getDatesBetween(event.startDate, event.endDate);
          allDates.push(...dates);
        }

        // Remove duplicates
        const uniqueDates = [...new Set(allDates)];

        if (uniqueDates.length > 0) {
          const rows = uniqueDates.map(date => ({
            accommodation_id: imp.accommodation_id,
            partner_id: imp.partner_id,
            date,
            status: 'booked_external',
            source,
          }));

          // Batch insert in chunks of 500
          for (let i = 0; i < rows.length; i += 500) {
            const chunk = rows.slice(i, i + 500);
            const { error: insertError } = await supabase
              .from('accommodation_calendar')
              .upsert(chunk, { onConflict: 'accommodation_id,date' });
            if (insertError) throw insertError;
          }
        }

        // Update sync status
        await supabase
          .from('accommodation_ical_imports')
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'success',
            last_sync_error: null,
          })
          .eq('id', imp.id);

        results.push({ id: imp.id, status: 'success' });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Sync failed for import ${imp.id}:`, errorMsg);

        await supabase
          .from('accommodation_ical_imports')
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'error',
            last_sync_error: errorMsg,
          })
          .eq('id', imp.id);

        results.push({ id: imp.id, status: 'error', error: errorMsg });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error syncing iCal imports:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
