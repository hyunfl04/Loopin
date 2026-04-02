const BRAND_COLOR = "#A8E6CF"; 
const TEXT_DARK = "#4A4A4A";
const TEXT_LIGHT = "#7A7A7A";

// Assuming your logo is at: public/assets/logo.png
// Accessing via: http://localhost:3001/assets/logo.png
const LOGO_URL = "http://localhost:3001/assets/logo.png"; 

function buildEmailHtml(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fffe;font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;color:${TEXT_DARK};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fffe;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:600px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.05);border:1px solid #e0f2f1;">
          
          <tr>
            <td style="background:linear-gradient(135deg, #A8E6CF 0%, #A8D8EA 100%);padding:30px;text-align:center;">
              <img src="${LOGO_URL}" alt="Loopin Logo" style="width:64px; height:auto; margin-bottom:12px; border-radius:14px; display: block; margin-left: auto; margin-right: auto;">
              
              <h1 style="margin:0;color:#2D6A4F;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Loopin</h1>
              <p style="margin:5px 0 0;color:#2D6A4F;font-size:14px;font-weight:600;opacity:0.8;">Stay in the Loop!</p>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 30px;">
              <h2 style="margin:0 0 20px;color:${TEXT_DARK};font-size:22px;font-weight:700;">${title}</h2>
              <div style="color:${TEXT_DARK};font-size:16px;line-height:1.6;">
                ${bodyHtml}
              </div>
              <div style="margin-top:30px;text-align:center;">
                <a href="http://localhost:3001/home" style="display:inline-block;background:linear-gradient(135deg, #A8E6CF 0%, #7DC4A5 100%);color:#2D6A4F;text-decoration:none;padding:14px 30px;border-radius:15px;font-weight:700;font-size:16px;box-shadow:0 4px 15px rgba(168,230,207,0.4);">Open Loopin Now 🚀</a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #f0f0f0;">
              <p style="margin:0;color:${TEXT_LIGHT};font-size:12px;font-weight:600;">
                © ${new Date().getFullYear()} Loopin Team 🔥 We appreciate your consistency!
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports.emailTemplates = {
  habitReminder: (habitName) => ({
    subject: `⏰ Reminder: Time for ${habitName}!`,
    html: buildEmailHtml(
      "It's time to shine! ✨",
      `<p>Hi there,</p>
       <p>It's time for your habit: <strong style="color:#2D6A4F;font-size:18px;">${habitName}</strong>.</p>
       <p>Small daily habits lead to big changes. Don't forget to check in once you're done!</p>`
    )
  }),

  streakWarning: (habitName) => ({
    subject: `🔥 Heads up: You're about to lose your ${habitName} streak!`,
    html: buildEmailHtml(
      "Don't let that precious streak slip away! 😱",
      `<p>Hi there,</p>
       <p>You haven't completed your habit: <strong>${habitName}</strong> yet today.</p>
       <p>If you don't check in before 11:59 PM, your streak will reset to zero!</p>
       <p style="background:#fff9f0;padding:15px;border-radius:10px;border-left:4px solid #FFEAA7;">
         💪 Just one more push—you've got this!
       </p>`
    )
  }),

  newMessage: (senderName, messagePreview) => ({
    subject: `💬 New message from ${senderName}`,
    html: buildEmailHtml(
      "You have a new message! 💌",
      `<p>Hi there,</p>
       <p><strong>${senderName}</strong> just sent you a message on Loopin.</p>
       <p style="background:#f6fffb;padding:14px;border-radius:10px;border-left:4px solid #A8E6CF;">
         ${messagePreview}
       </p>
       <p>Open Loopin to reply now.</p>`
    )
  })
};