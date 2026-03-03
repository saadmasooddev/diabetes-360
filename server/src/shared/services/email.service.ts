import sgMail from "@sendgrid/mail";
import { config } from "../../app/config";

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
			meetingLink: string;
			startTimeIso: string;
			durationMinutes: number;
			isPhysician: boolean;
		},
	): Promise<void> {
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
            <a href="${options.meetingLink}" 
               style="background-color: #00856f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Join Video Call
            </a>
          </div>
          <p style="word-break: break-all; color: #6b7280; font-size: 14px;">Or copy this link: ${options.meetingLink}</p>
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
}

export const emailService = new EmailService();
