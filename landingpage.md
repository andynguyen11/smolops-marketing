# Inbox Agent Pilot Landing Page

## Goal

Create a simple landing page to explain the SmolOps Inbox Agent and allow small business owners to sign up for the free pilot.

This page will be shared with leads generated from neighborhood groups and direct outreach.

Primary objective:
Collect pilot signups and initiate discovery conversations.

---

# Page Route

/inbox-agent-pilot

---

# Page Structure

1. Hero
2. What It Does
3. Use Cases
4. Pilot Explanation
5. Privacy Section
6. Ideal Businesses
7. Signup Form
8. Confirmation Page

---

# Hero Section

Headline:
Stop spending evenings catching up on customer emails.

Subheadline:
The SmolOps Inbox Agent drafts replies and organizes incoming messages so small businesses spend less time on admin work.

Primary CTA:
Join the Free Pilot

Anchor scroll to signup form.

---

# What It Does Section

Explain the problem:

Small businesses spend hours responding to repetitive customer messages.

Examples:

- quote requests
- scheduling
- updates
- document requests

Explain solution:

Inbox Agent reads messages and drafts replies.

Benefits:

- time savings
- organized inbox
- faster responses

---

# Use Case Section

Cards layout (4 cards):

Quote Requests  
Scheduling Questions  
Customer Updates  
Common Questions

Each card includes:

Title  
Short explanation

---

# Pilot Explanation

Explain that:

- this is an early pilot
- limited number of businesses
- goal is learning + improvement

Include bullet list:

- time savings measurement
- workflow discovery
- feedback sessions

---

# Privacy Section

Important trust section.

Key points:

- no software installation
- read + draft access only
- emails remain in user inbox
- no manual reading of emails

---

# Ideal Businesses Section

List examples:

- landscapers
- contractors
- cleaners
- pool service
- salons
- small retail

Goal: help readers self-identify.

---

# Signup Form

Fields:

name
business_name
email
phone_optional

business_type (dropdown)

message_channels (checkbox)
- email
- sms
- phone
- website form
- social

message_volume (dropdown)

biggest_pain (textarea)

---

# Submission Behavior

POST /api/pilot-signup

Server actions:

1. store record in database
2. send confirmation email
3. notify founder via email/slack
4. redirect to thank-you page

---

# Database Table

pilot_signups

columns:

id
name
business_name
email
phone
business_type
message_channels jsonb
message_volume
biggest_pain
created_at

---

# Thank You Page

/thank-you

Message:

Thanks for signing up.

We'll review your submission and reach out to schedule a quick discovery conversation.

---

# Optional Enhancements

Future improvements:

- calendly integration
- case study section
- pilot progress stats
- testimonial quotes