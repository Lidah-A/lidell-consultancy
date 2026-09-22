import sgMail from "@sendgrid/mail"

const SENDGRID_KEY = process.env.SENDGRID_API_KEY
const TEAM_EMAIL = process.env.TEAM_NOTIFICATION_EMAIL
const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || TEAM_EMAIL

if (SENDGRID_KEY) {
  sgMail.setApiKey(SENDGRID_KEY)
} else {
  console.warn("SendGrid API key not configured (SENDGRID_API_KEY)")
}

export async function notifyTeam(subject: string, text: string, html?: string) {
  if (!SENDGRID_KEY || !TEAM_EMAIL) {
    console.warn("Skipping notification: SENDGRID_API_KEY or TEAM_NOTIFICATION_EMAIL not set")
    return
  }

  const msg = {
    to: TEAM_EMAIL,
    from: FROM_EMAIL || TEAM_EMAIL,
    subject,
    text,
    html,
  }

  try {
    await sgMail.send(msg)
  } catch (err) {
    console.error("Failed to send notification", err)
  }
}

export async function notifyEmail(to: string, subject: string, text: string, html?: string) {
  if (!SENDGRID_KEY || !FROM_EMAIL) {
    console.warn("Skipping notification: SENDGRID_API_KEY or NOTIFICATION_FROM_EMAIL not set")
    return
  }

  const msg = {
    to,
    from: FROM_EMAIL,
    subject,
    text,
    html,
  }

  try {
    await sgMail.send(msg)
  } catch (err) {
    console.error("Failed to send email", err)
  }
}
