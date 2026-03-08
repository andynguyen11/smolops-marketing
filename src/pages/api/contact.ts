import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, email, business, message } = body;
    const turnstileToken = body['cf-turnstile-response'];

    // Validate required fields
    if (!name || !email || !message) {
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

    // Send email via Cloudflare Email Workers (MailChannels)
    // This uses Cloudflare's free transactional email integration
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
          name: 'SmolOps Contact Form',
        },
        subject: `SmolOps Inquiry from ${name}`,
        content: [
          {
            type: 'text/plain',
            value: [
              `New contact form submission from SmolOps.com`,
              ``,
              `Name: ${name}`,
              `Email: ${email}`,
              `Business Type: ${business || 'Not specified'}`,
              ``,
              `Message:`,
              `${message}`,
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
