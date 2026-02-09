import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CalendarEntry {
  id: string;
  accommodation_id: string;
  date: string;
  status: string;
  source: string;
  note: string | null;
}

function formatDateIcal(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

function groupConsecutiveDates(entries: CalendarEntry[]): { start: string; end: string; status: string; source: string }[] {
  if (entries.length === 0) return [];

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const groups: { start: string; end: string; status: string; source: string }[] = [];

  let currentStart = sorted[0].date;
  let currentEnd = sorted[0].date;
  let currentStatus = sorted[0].status;
  let currentSource = sorted[0].source;

  for (let i = 1; i < sorted.length; i++) {
    const entry = sorted[i];
    const expectedNext = addDays(currentEnd, 1);

    if (entry.date === expectedNext && entry.status === currentStatus) {
      currentEnd = entry.date;
    } else {
      groups.push({ start: currentStart, end: addDays(currentEnd, 1), status: currentStatus, source: currentSource });
      currentStart = entry.date;
      currentEnd = entry.date;
      currentStatus = entry.status;
      currentSource = entry.source;
    }
  }

  groups.push({ start: currentStart, end: addDays(currentEnd, 1), status: currentStatus, source: currentSource });
  return groups;
}

function generateIcs(accommodationName: string, entries: CalendarEntry[]): string {
  const groups = groupConsecutiveDates(entries);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  let ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Sribooking//Accommodation//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:${accommodationName}\r\n`;

  groups.forEach((group, index) => {
    const summary = group.status === 'blocked' ? 'Blocked' : 'Booked - Sribooking';
    const uid = `sribooking-${group.start}-${index}@sribooking.com`;

    ics += `BEGIN:VEVENT\r\n`;
    ics += `DTSTART;VALUE=DATE:${formatDateIcal(group.start)}\r\n`;
    ics += `DTEND;VALUE=DATE:${formatDateIcal(group.end)}\r\n`;
    ics += `DTSTAMP:${now}\r\n`;
    ics += `UID:${uid}\r\n`;
    ics += `SUMMARY:${summary}\r\n`;
    ics += `STATUS:CONFIRMED\r\n`;
    ics += `END:VEVENT\r\n`;
  });

  ics += `END:VCALENDAR\r\n`;
  return ics;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response('Missing token parameter', { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find accommodation by ical_token
    const { data: accommodation, error: accError } = await supabase
      .from('accommodations')
      .select('id, name')
      .eq('ical_token', token)
      .single();

    if (accError || !accommodation) {
      return new Response('Invalid token', { status: 404, headers: corsHeaders });
    }

    // Get all calendar entries that should be exported
    const { data: entries, error: calError } = await supabase
      .from('accommodation_calendar')
      .select('*')
      .eq('accommodation_id', accommodation.id)
      .in('status', ['booked_sribooking', 'booked_external', 'blocked'])
      .order('date');

    if (calError) throw calError;

    const icsContent = generateIcs(accommodation.name, entries || []);

    return new Response(icsContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${accommodation.name.replace(/[^a-zA-Z0-9]/g, '_')}.ics"`,
      },
    });
  } catch (error) {
    console.error('Error generating iCal export:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
