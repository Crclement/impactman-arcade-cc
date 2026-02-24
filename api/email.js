const { Resend } = require('resend');

// Initialize Resend with API key from environment
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'Impact Arcade <noreply@impactarcade.com>';

async function sendWelcomeEmail(user) {
  if (!resend) {
    console.log(`[Email] Resend not configured - would send welcome email to ${user.email}`);
    return { success: true, mock: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: 'Welcome to Impact Arcade!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #16114F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #D9FF69; font-size: 28px; margin: 0;">Impact Arcade</h1>
            </div>

            <!-- Main Card -->
            <div style="background: white; border-radius: 16px; padding: 32px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🎮</div>
              <h2 style="color: #16114F; font-size: 24px; margin: 0 0 8px 0;">Welcome, ${user.name}!</h2>
              <p style="color: #666; font-size: 16px; margin: 0 0 24px 0;">
                Your Impact Arcade account is ready.
              </p>

              <!-- Stats Box -->
              <div style="background: linear-gradient(135deg, #D9FF69 0%, #00DC82 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="color: #16114F; font-size: 14px; margin: 0 0 4px 0; font-weight: bold;">
                  Every game you play helps remove
                </p>
                <p style="color: #16114F; font-size: 24px; margin: 0; font-weight: bold;">
                  REAL ocean plastic!
                </p>
              </div>

              <!-- CTA Button -->
              <a href="https://impactarcade.com/dashboard/${user.id}"
                 style="display: inline-block; background: #16114F; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                View Your Dashboard
              </a>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #D9FF69; font-size: 12px; margin: 0;">
                WARNING: This game removes real-world ocean plastic!
              </p>
              <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 8px 0 0 0;">
                Impact Arcade • Making games matter
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error(`[Email] Failed to send welcome email:`, error);
      return { success: false, error };
    }

    console.log(`[Email] Welcome email sent to ${user.email} (ID: ${data.id})`);
    return { success: true, id: data.id };
  } catch (err) {
    console.error(`[Email] Error sending welcome email:`, err);
    return { success: false, error: err.message };
  }
}

async function sendScoreClaimedEmail(user, session) {
  if (!resend) {
    console.log(`[Email] Resend not configured - would send score claimed email to ${user.email}`);
    return { success: true, mock: true };
  }

  try {
    const plasticLbs = (session.bags * 0.1).toFixed(1);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `Score Saved! ${session.score.toLocaleString()} points`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #16114F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #D9FF69; font-size: 28px; margin: 0;">Impact Arcade</h1>
            </div>

            <!-- Main Card -->
            <div style="background: white; border-radius: 16px; padding: 32px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🏆</div>
              <h2 style="color: #16114F; font-size: 24px; margin: 0 0 8px 0;">Nice game, ${user.name}!</h2>
              <p style="color: #666; font-size: 16px; margin: 0 0 24px 0;">
                Your score has been saved to your account.
              </p>

              <!-- Score Stats -->
              <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 24px;">
                <div style="background: #FCF252; border-radius: 12px; padding: 16px 24px;">
                  <div style="color: #16114F; font-size: 28px; font-weight: bold;">${session.score.toLocaleString()}</div>
                  <div style="color: #16114F; font-size: 12px; font-weight: bold;">SCORE</div>
                </div>
                <div style="background: #D9FF69; border-radius: 12px; padding: 16px 24px;">
                  <div style="color: #16114F; font-size: 28px; font-weight: bold;">L${session.level}</div>
                  <div style="color: #16114F; font-size: 12px; font-weight: bold;">LEVEL</div>
                </div>
                <div style="background: #00DC82; border-radius: 12px; padding: 16px 24px;">
                  <div style="color: #16114F; font-size: 28px; font-weight: bold;">${session.bags}</div>
                  <div style="color: #16114F; font-size: 12px; font-weight: bold;">BAGS</div>
                </div>
              </div>

              <!-- Impact Box -->
              <div style="background: linear-gradient(135deg, #00DC82 0%, #4D8BEC 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="color: white; font-size: 14px; margin: 0 0 4px 0;">
                  This game removed
                </p>
                <p style="color: white; font-size: 32px; margin: 0; font-weight: bold;">
                  ${plasticLbs} lbs
                </p>
                <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 4px 0 0 0;">
                  of ocean plastic!
                </p>
              </div>

              <!-- CTA Button -->
              <a href="https://impactarcade.com/dashboard/${user.id}"
                 style="display: inline-block; background: #16114F; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                View All Your Scores
              </a>

              <!-- Console Info -->
              <p style="color: #999; font-size: 12px; margin: 20px 0 0 0;">
                Played on Console ${session.consoleId}
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">
                Impact Arcade • Making games matter
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error(`[Email] Failed to send score claimed email:`, error);
      return { success: false, error };
    }

    console.log(`[Email] Score claimed email sent to ${user.email} (ID: ${data.id})`);
    return { success: true, id: data.id };
  } catch (err) {
    console.error(`[Email] Error sending score claimed email:`, err);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendWelcomeEmail,
  sendScoreClaimedEmail,
};
