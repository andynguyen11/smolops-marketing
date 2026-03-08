import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, email, business, time_sinks, tools, hours_per_week, one_task } = body;
    const turnstileToken = body['cf-turnstile-response'];

    // Validate required fields
    if (!name || !email || !business) {
      return new Response(
        JSON.stringify({ error: 'Please fill in all required fields.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify Turnstile token
    if (turnstileToken) {
      const turnstileRes = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret: import.meta.env.TURNSTILE_SECRET_KEY || '',
            response: turnstileToken,
          }),
        }
      );
      const turnstileData = await turnstileRes.json() as { success: boolean };
      if (!turnstileData.success) {
        return new Response(
          JSON.stringify({ error: 'CAPTCHA verification failed. Please try again.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const timeSinksList = Array.isArray(time_sinks) ? time_sinks.join(', ') : (time_sinks || 'Not specified');
    const toolsList = Array.isArray(tools) ? tools.join(', ') : (tools || 'Not specified');

    // Send email via Cloudflare Email Workers (MailChannels)
    await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: 'andynguyen11@gmail.com', name: 'Andy Nguyen' }],
          },
        ],
        from: {
          email: 'noreply@smolops.com',
          name: 'SmolOps AI Admin Audit',
        },
        subject: `SmolOps AI Admin Audit Request - ${name} (${business})`,
        content: [
          {
            type: 'text/plain',
            value: [
              `New AI Admin Audit request from SmolOps.com`,
              ``,
              `--- Contact Info ---`,
              `Name: ${name}`,
              `Email: ${email}`,
              ``,
              `--- Business Profile ---`,
              `Business Type: ${business}`,
              `Hours/week on admin: ${hours_per_week || 'Not specified'}`,
              ``,
              `--- Biggest Time Sinks ---`,
              timeSinksList,
              ``,
              `--- Tools Currently Used ---`,
              toolsList,
              ``,
              `--- If they could eliminate ONE task ---`,
              one_task || 'Not provided',
            ].join('\n'),
          },
        ],
        reply_to: { email, name },
      }),
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again later.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
