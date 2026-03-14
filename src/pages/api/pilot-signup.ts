import type { APIRoute } from 'astro';
import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const {
      name,
      business_name,
      email,
      phone,
      business_type,
      message_channels,
      message_volume,
      biggest_pain,
    } = body;
    const turnstileToken = body['cf-turnstile-response'];

    const env = (locals as any).runtime?.env;
    const turnstileSecret = env?.TURNSTILE_SECRET_KEY;
    const emailBinding = env?.AUDIT_EMAIL;

    if (!name || !email || !business_name || !business_type) {
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

    const channelsList = Array.isArray(message_channels)
      ? message_channels.join(', ')
      : (message_channels || 'Not specified');

    const msg = createMimeMessage();

    msg.setSender({ name: 'SmolOps Inbox Agent Pilot', addr: 'audit@smolops.com' });
    msg.setRecipient('andynguyen11@gmail.com');
    msg.setSubject(`Inbox Agent Pilot Signup - ${name} (${business_name})`);

    msg.addMessage({
      contentType: 'text/plain',
      data: [
        `New Inbox Agent Pilot signup from SmolOps.com`,
        ``,
        `--- Contact Info ---`,
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone || 'Not provided'}`,
        ``,
        `--- Business Info ---`,
        `Business Name: ${business_name}`,
        `Business Type: ${business_type}`,
        ``,
        `--- Communication ---`,
        `Message Channels: ${channelsList}`,
        `Message Volume: ${message_volume || 'Not specified'}`,
        ``,
        `--- Biggest Pain ---`,
        biggest_pain || 'Not provided',
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
    console.error('pilot-signup api error', err);

    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again later.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
