import sgMail from "@sendgrid/mail";
import { config } from "../../app/config";
import { COMMON_PREFIX, ROUTES } from "@/config/routes";

export class EmailService {
	constructor() {
		// Set SendGrid API key
		sgMail.setApiKey(config.email.apiKey);
	}

	async sendPasswordResetEmail(
		email: string,
		resetToken: string,
		userName: string,
	): Promise<void> {
		const resetUrl = `${config.frontendUrl}/auth/reset-password?token=${resetToken}`;

		const msg = {
			to: email,
			from: {
				email: config.email.from,
				name: config.email.fromName,
			},
			subject: "Password Reset Request - Diabetes 360",
			html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Password Reset Request</h2>
          <p>Hello ${userName},</p>
          <p>We received a request to reset your password for your Diabetes 360 account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            The Diabetes 360 Team
          </p>
        </div>
      `,
		};

		await sgMail.send(msg);
	}

	async sendWelcomeEmail(
		email: string,
		userName: string,
		password: string,
	): Promise<void> {
		const loginUrl = `${config.frontendUrl}/auth/login`;

		const msg = {
			to: email,
			from: {
				email: config.email.from,
				name: config.email.fromName,
			},
			subject: "Welcome to Diabetes 360 - Your Account Details",
			html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to Diabetes 360!</h2>
          <p>Hello ${userName},</p>
          <p>Your account has been successfully created. Here are your login credentials:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Your Login Details:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Login to Your Account
            </a>
          </div>
          
          <p><strong>Important Security Notes:</strong></p>
          <ul style="color: #374151;">
            <li>Please change your password after your first login</li>
            <li>Keep your login credentials secure and don't share them</li>
            <li>If you suspect any unauthorized access, contact us immediately</li>
          </ul>
          
          <p>We're excited to help you manage your diabetes journey effectively!</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            The Diabetes 360 Team
          </p>
        </div>
      `,
		};

		await sgMail.send(msg);
	}

	async sendMeetingLinkEmail(
		options: {
			to: string;
			recipientName: string;
			patientName: string;
			physicianName: string;
			startTimeIso: string;
			durationMinutes: number;
			isPhysician: boolean;
      bookingId: string
		},
	): Promise<void> {
		const meetingLinkUrl = `${config.frontendUrl}${ROUTES.MEETING_LINK.replace(":bookingId", options.bookingId)}`;
		const startDate = new Date(options.startTimeIso);
		const dateStr = startDate.toLocaleDateString(undefined, {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
		const timeStr = startDate.toLocaleTimeString(undefined, {
			hour: "2-digit",
			minute: "2-digit",
		});

		const msg = {
			to: options.to,
			from: {
				email: config.email.from,
				name: config.email.fromName,
			},
			subject: `Your Consultation Meeting Link - Diabetes 360`,
			html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00856f;">Your Consultation is Scheduled</h2>
          <p>Hello ${options.recipientName},</p>
          <p>Your ${options.isPhysician ? "consultation with " + options.patientName : "video consultation with " + options.physicianName} is scheduled:</p>
          <div style="background-color: #f7f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Date:</strong> ${dateStr}</p>
            <p style="margin: 8px 0 0 0;"><strong>Time:</strong> ${timeStr}</p>
            <p style="margin: 8px 0 0 0;"><strong>Duration:</strong> ${options.durationMinutes} minutes</p>
          </div>
          <p>Join the video call using the link below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${meetingLinkUrl}" 
               style="background-color: #00856f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Join Video Call
            </a>
          </div>
          <p style="word-break: break-all; color: #6b7280; font-size: 14px;">Or copy this link: ${meetingLinkUrl}</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            The Diabetes 360 Team
          </p>
        </div>
      `,
		};

		await sgMail.send(msg);
	}

	async verifyConnection(): Promise<boolean> {
		try {
			// SendGrid doesn't have a direct verify method, but we can test by sending a simple email
			// For now, we'll just check if the API key is set
			return !!config.email.apiKey;
		} catch (error) {
			console.error("SendGrid connection verification failed:", error);
			return false;
		}
	}
	async sendSignInCodeEmail(email: string, code: string, userName: string) {
		const msg = {
			to: email,
			from: {
				email: config.email.from,
				name: config.email.fromName,
			},
			subject: `Your Sign-In Code - Diabetes 360`,
			html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00856f;">Your Sign-In Code</h2>
          <p>Hello ${userName},</p>
          <p>We received a request to sign in to your Diabetes 360 account using a one-time code.</p>
          <div style="background-color: #f7f9f9; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
            <span style="display: inline-block; font-size: 2.1em; letter-spacing: 5px; font-weight: bold; color: #00856f;">
              ${code}
            </span>
            <p style="margin: 18px 0 0 0; color: #444; font-size: 15px;">
              Enter this 6-digit code in the sign-in form to continue.<br>
              <strong>This code will expire in 5 minutes.</strong>
            </p>
          </div>
          <p>If you did not request this code, you can safely ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            The Diabetes 360 Team
          </p>
        </div>
      `,
		};

		await sgMail.send(msg);
	}

	async sendEmailVerificationOtp(
		email: string,
		code: string,
		userName: string,
	): Promise<void> {
		const msg = {
			to: email,
			from: {
				email: config.email.from,
				name: config.email.fromName,
			},
			subject: "Verify your email - Diabetes 360",
			html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00856f;">Verify your email</h2>
          <p>Hello ${userName},</p>
          <p>Thanks for signing up for Diabetes 360. Enter this code in the app to verify your email address.</p>
          <div style="background-color: #f7f9f9; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
            <span style="display: inline-block; font-size: 2.1em; letter-spacing: 5px; font-weight: bold; color: #00856f;">
              ${code}
            </span>
            <p style="margin: 18px 0 0 0; color: #444; font-size: 15px;">
              Enter this 6-digit code in the verification form.<br>
              <strong>This code will expire in 5 minutes.</strong>
            </p>
          </div>
          <p>If you did not create an account, you can safely ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            The Diabetes 360 Team
          </p>
        </div>
      `,
		};

		await sgMail.send(msg);
	}
}

export const emailService = new EmailService();
