import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Tuple

from app.core.config import settings

logger = logging.getLogger("sai-backend")


def build_otp_email_html(recipient_name: str, otp_code: str) -> str:
    """Renders a sleek, responsive, branded HTML email for OTP delivery."""
    name_display = recipient_name if recipient_name and recipient_name.strip() else "User"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SAI Property Finder - Your Verification OTP</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; border: 1px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0, 109, 106, 0.08); overflow: hidden;">
    <!-- Brand Header -->
    <tr>
      <td style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 1px solid #F1F5F9; background: linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%);">
        <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #006D6A;">SAI</h1>
        <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #008F8C;">Smart AI Property Finder</p>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px;">
        <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #0F172A;">
          Hello {name_display},
        </h2>

        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
          Your OTP for SAI Property Finder verification is:
        </p>

        <!-- 6-Digit OTP Highlight Box -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
          <tr>
            <td style="background: linear-gradient(135deg, #E6F4F2 0%, #F0FDF4 100%); border: 2px dashed #008F8C; border-radius: 18px; padding: 22px; text-align: center;">
              <span style="font-family: 'SF Mono', Monaco, Menlo, 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #004F4D; display: inline-block; padding-left: 12px;">
                {otp_code}
              </span>
            </td>
          </tr>
        </table>

        <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; font-weight: 600; color: #92400E;">
            This OTP is valid for <strong>5 minutes</strong>.
          </p>
        </div>

        <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.6; color: #475569;">
          For your security, please do not share this OTP with anyone.
        </p>

        <p style="margin: 0 0 28px 0; font-size: 13px; line-height: 1.6; color: #64748B;">
          If you did not request this OTP, you can safely ignore this email.
        </p>

        <!-- Signature -->
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155;">
          Regards,<br>
          <strong style="color: #006D6A;">SAI – Smart AI Property Finder</strong>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center;">
        <p style="margin: 0 0 6px 0; font-size: 11px; color: #94A3B8;">
          This is an automated security notification from SAI Smart AI Property Finder platform.
        </p>
        <p style="margin: 0; font-size: 11px; font-weight: 600; color: #64748B;">
          &copy; 2026 SAI – Smart AI Property Finder. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>"""


def build_otp_email_text(recipient_name: str, otp_code: str) -> str:
    """Renders plain text alternative for clients that do not support HTML."""
    name_display = recipient_name if recipient_name and recipient_name.strip() else "User"

    return f"""Hello {name_display},

Your OTP for SAI Property Finder verification is:

{otp_code}

This OTP is valid for 5 minutes.

For your security, please do not share this OTP with anyone.

If you did not request this OTP, you can safely ignore this email.

Regards,
SAI – Smart AI Property Finder
"""


def send_otp_email(
    recipient_email: str,
    otp_code: str,
    user_name: Optional[str] = None
) -> Tuple[bool, Optional[str]]:
    """
    Dispatches a cryptographically generated 6-digit OTP to the registered user's email.
    
    Security Guarantee:
    - Never logs the plain-text OTP code.
    - Handles timeouts and connection drops gracefully.
    - Supports both SSL (port 465) and STARTTLS (port 587/25).
    """
    if not recipient_email or "@" not in recipient_email:
        return False, "Invalid recipient email address"

    host = (settings.SMTP_HOST or "").strip()
    port = int(settings.SMTP_PORT or 587)
    username = (settings.SMTP_USERNAME or "").strip()
    password = (settings.SMTP_PASSWORD or "").strip()
    from_addr = settings.sender_email
    from_name = settings.SMTP_FROM_NAME or "SAI Property Finder"

    # Check if real SMTP credentials are fully configured
    is_smtp_configured = bool(
        host
        and host not in ["", "none", "localhost", "127.0.0.1"]
        and username
        and password
    )

    if not is_smtp_configured:
        err_msg = (
            "Email delivery provider is not configured. Please configure SMTP_HOST, SMTP_PORT, "
            "SMTP_USERNAME, and SMTP_PASSWORD in backend/.env to deliver real OTP emails."
        )
        logger.warning(f"[EmailService] Cannot send OTP: {err_msg}")
        return False, err_msg

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "SAI Property Finder - Your Verification OTP"
    msg["From"] = f"{from_name} <{from_addr}>"
    msg["To"] = recipient_email

    # Attach both Plain Text and HTML versions
    plain_text = build_otp_email_text(user_name or "User", otp_code)
    html_content = build_otp_email_html(user_name or "User", otp_code)

    msg.attach(MIMEText(plain_text, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=12) as server:
                server.login(username, password)
                server.sendmail(from_addr, [recipient_email], msg.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=12) as server:
                server.ehlo()
                if port == 587:
                    server.starttls()
                    server.ehlo()
                server.login(username, password)
                server.sendmail(from_addr, [recipient_email], msg.as_string())

        logger.info(f"[EmailService] Real verification OTP email successfully delivered to {recipient_email} via {host}:{port}")
        return True, None
    except smtplib.SMTPAuthenticationError as auth_err:
        err_msg = (
            f"SMTP Authentication failed: {auth_err}. "
            f"If using Gmail, generate a 16-character App Password at https://myaccount.google.com/apppasswords"
        )
        logger.error(f"[EmailService] {err_msg}")
        return False, err_msg
    except smtplib.SMTPException as smtp_err:
        err_msg = f"SMTP protocol error: {smtp_err}"
        logger.error(f"[EmailService] {err_msg}")
        return False, err_msg
    except (OSError, TimeoutError) as net_err:
        err_msg = f"SMTP connection error: {net_err}"
        logger.error(f"[EmailService] {err_msg}")
        return False, err_msg
    except Exception as e:
        err_msg = f"Unexpected error during email dispatch: {e}"
        logger.error(f"[EmailService] {err_msg}")
        return False, err_msg
