import type { APIRoute } from 'astro';
import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { name, email, business, time_sinks, tools, hours_per_week, one_task } = body;
    const turnstileToken = body['cf-turnstile-response'];

    const env = (locals as any).runtime?.env;
    const turnstileSecret = env?.TURNSTILE_SECRET_KEY;
    const emailBinding = env?.AUDIT_EMAIL;

    if (!name || !email || !business) {
      return new Response(
        JSON.stringify({ error: 'Please fill in all required fields.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!turnstileToken) {
      return new Response(
        JSON.stringify({ error: 'Missing CAPTCHA token.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!turnstileSecret) {
      return new Response(
        JSON.stringify({ error: 'Server CAPTCHA secret is not configured.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!emailBinding) {
      return new Response(
        JSON.stringify({ error: 'Email binding is not configured.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const turnstileRes = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: turnstileToken,
        }),
      }
    );

    const turnstileData = await turnstileRes.json() as {
      success: boolean;
      ['error-codes']?: string[];
    };

    if (!turnstileData.success) {
      return new Response(
        JSON.stringify({
          error: 'CAPTCHA verification failed. Please try again.',
          details: turnstileData['error-codes'] || [],
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const timeSinksList = Array.isArray(time_sinks) ? time_sinks.join(', ') : (time_sinks || 'Not specified');
    const toolsList = Array.isArray(tools) ? tools.join(', ') : (tools || 'Not specified');

    const msg = createMimeMessage();

    // Sender must be on the domain where Email Routing is active
    msg.setSender({ name: 'SmolOps AI Admin Audit', addr: 'audit@smolops.com' });

    // Since the binding is locked to destination_address, this can match that address
    msg.setRecipient('andynguyen11@gmail.com');

    msg.setSubject(`SmolOps AI Admin Audit Request - ${name} (${business})`);

    msg.addMessage({
      contentType: 'text/plain',
      data: [
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
    });

    const message = new EmailMessage(
      'audit@smolops.com',
      'andynguyen11@gmail.com',
      msg.asRaw()
    );

    await emailBinding.send(message);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('contact api error', err);

    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again later.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};