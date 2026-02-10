import { useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { paymentDetails } from "@/mocks/payments";
import { ROUTES } from "@/config/routes";

type PaymentMethod = "card" | "bank" | "transfer";
type PaymentStep = "form" | "success";

export function Payments() {
	const [, setLocation] = useLocation();
	const [paymentStep, setPaymentStep] = useState<PaymentStep>("form");
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
	const [cardNumber, setCardNumber] = useState("");
	const [expirationDate, setExpirationDate] = useState("");
	const [cvv, setCvv] = useState("");
	const [saveCard, setSaveCard] = useState(false);

	const formatPrice = (price: number) => {
		return price.toLocaleString("en-PK");
	};

	const handleContinuePayment = () => {
		// Show success screen
		setPaymentStep("success");
	};

	const handleContinue = () => {
		// Navigate to dashboard or home
		setLocation(ROUTES.DASHBOARD);
	};

	// Payment Success Screen
	if (paymentStep === "success") {
		return (
			<div className="flex min-h-screen" style={{ background: "#F7F9F9" }}>
				<Sidebar />

				<main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
					<div className="w-full max-w-full ">
						<Card
							className="p-12 flex flex-col items-center justify-center"
							style={{
								background: "#FFFFFF",
								borderRadius: "16px",
								border: "1px solid rgba(0, 0, 0, 0.1)",
								minHeight: "400px",
							}}
							data-testid="card-payment-success"
						>
							{/* Success Icon */}
							<div
								className="mb-8"
								style={{
									width: "80px",
									height: "80px",
									borderRadius: "50%",
									background: "#00856F",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
								data-testid="icon-success"
							>
								<svg width="40" height="40" viewBox="0 0 40 40" fill="none">
									<path
										d="M33.3333 10L15 28.3333L6.66667 20"
										stroke="#FFFFFF"
										strokeWidth="4"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</div>

							{/* Payment Completed Text */}
							<h1
								style={{
									fontSize: "32px",
									fontWeight: 700,
									color: "#00856F",
									textAlign: "center",
									marginBottom: "48px",
								}}
								data-testid="text-payment-completed"
							>
								Payment Completed
							</h1>

							{/* Continue Button */}
							<Button
								onClick={handleContinue}
								className="w-full max-w-[700px]"
								style={{
									background: "#00856F",
									color: "#FFFFFF",
									fontWeight: 600,
									fontSize: "16px",
									borderRadius: "12px",
									padding: "16px",
									height: "auto",
								}}
								data-testid="button-continue"
							>
								Continue
							</Button>
						</Card>
					</div>
				</main>
			</div>
		);
	}

	// Payment Form Screen
	return (
		<div className="flex min-h-screen" style={{ background: "#F7F9F9" }}>
			<Sidebar />

			<main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
				<div className="w-full max-w-[1200px]">
					<div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
						{/* Payment Form Section */}
						<Card
							className="p-8"
							style={{
								background: "#FFFFFF",
								borderRadius: "16px",
								border: "1px solid rgba(0, 0, 0, 0.1)",
							}}
							data-testid="card-payment-form"
						>
							{/* Payment Amount */}
							<div className="mb-8">
								<h2
									style={{
										fontSize: "20px",
										fontWeight: 600,
										color: "#00856F",
										marginBottom: "8px",
									}}
									data-testid="text-payment-amount-label"
								>
									Payment Amount
								</h2>
								<p
									style={{
										fontSize: "36px",
										fontWeight: 700,
										color: "#00453A",
									}}
									data-testid="text-payment-amount"
								>
									Rs {formatPrice(paymentDetails.amount)}
								</p>
							</div>

							{/* Payment Method */}
							<div className="mb-6">
								<Label
									style={{
										fontSize: "16px",
										fontWeight: 600,
										color: "#00453A",
										marginBottom: "12px",
										display: "block",
									}}
									data-testid="label-pay-with"
								>
									Pay With:
								</Label>
								<RadioGroup
									value={paymentMethod}
									onValueChange={(value) =>
										setPaymentMethod(value as PaymentMethod)
									}
									className="flex gap-6"
									data-testid="radio-group-payment-method"
								>
									<div className="flex items-center gap-2">
										<RadioGroupItem
											value="card"
											id="card"
											style={{
												borderColor: "#00856F",
											}}
											data-testid="radio-card"
										/>
										<Label
											htmlFor="card"
											style={{
												fontSize: "14px",
												fontWeight: 500,
												color: "#00453A",
												cursor: "pointer",
											}}
										>
											Card
										</Label>
									</div>
									<div className="flex items-center gap-2">
										<RadioGroupItem
											value="bank"
											id="bank"
											style={{
												borderColor: "#00856F",
											}}
											data-testid="radio-bank"
										/>
										<Label
											htmlFor="bank"
											style={{
												fontSize: "14px",
												fontWeight: 500,
												color: "#00453A",
												cursor: "pointer",
											}}
										>
											Bank
										</Label>
									</div>
									<div className="flex items-center gap-2">
										<RadioGroupItem
											value="transfer"
											id="transfer"
											style={{
												borderColor: "#00856F",
											}}
											data-testid="radio-transfer"
										/>
										<Label
											htmlFor="transfer"
											style={{
												fontSize: "14px",
												fontWeight: 500,
												color: "#00453A",
												cursor: "pointer",
											}}
										>
											Transfer
										</Label>
									</div>
								</RadioGroup>
							</div>

							{/* Card Details Form */}
							{paymentMethod === "card" && (
								<div className="space-y-6">
									{/* Card Number */}
									<div>
										<Label
											htmlFor="cardNumber"
											style={{
												fontSize: "14px",
												fontWeight: 600,
												color: "#00453A",
												marginBottom: "8px",
												display: "block",
											}}
											data-testid="label-card-number"
										>
											Card Number
										</Label>
										<Input
											id="cardNumber"
											value={cardNumber}
											onChange={(e) => setCardNumber(e.target.value)}
											placeholder="1234 5678 9101 1121"
											style={{
												fontSize: "14px",
												padding: "12px 16px",
												borderRadius: "8px",
												border: "1px solid #E0E0E0",
											}}
											data-testid="input-card-number"
										/>
									</div>

									{/* Expiration Date and CVV */}
									<div className="grid grid-cols-2 gap-4">
										<div>
											<Label
												htmlFor="expirationDate"
												style={{
													fontSize: "14px",
													fontWeight: 600,
													color: "#00453A",
													marginBottom: "8px",
													display: "block",
												}}
												data-testid="label-expiration-date"
											>
												Expiration Date
											</Label>
											<Input
												id="expirationDate"
												value={expirationDate}
												onChange={(e) => setExpirationDate(e.target.value)}
												placeholder="MM/YY"
												style={{
													fontSize: "14px",
													padding: "12px 16px",
													borderRadius: "8px",
													border: "1px solid #E0E0E0",
												}}
												data-testid="input-expiration-date"
											/>
										</div>
										<div>
											<Label
												htmlFor="cvv"
												style={{
													fontSize: "14px",
													fontWeight: 600,
													color: "#00453A",
													marginBottom: "8px",
													display: "block",
												}}
												data-testid="label-cvv"
											>
												CVV
											</Label>
											<Input
												id="cvv"
												value={cvv}
												onChange={(e) => setCvv(e.target.value)}
												placeholder="123"
												maxLength={3}
												style={{
													fontSize: "14px",
													padding: "12px 16px",
													borderRadius: "8px",
													border: "1px solid #E0E0E0",
												}}
												data-testid="input-cvv"
											/>
										</div>
									</div>

									{/* Save Card Checkbox */}
									<div className="flex items-start gap-3">
										<Checkbox
											id="saveCard"
											checked={saveCard}
											onCheckedChange={(checked) =>
												setSaveCard(checked as boolean)
											}
											className="mt-0.5"
											style={{
												borderColor: "#00856F",
											}}
											data-testid="checkbox-save-card"
										/>
										<div className="flex-1">
											<Label
												htmlFor="saveCard"
												style={{
													fontSize: "14px",
													fontWeight: 500,
													color: "#00453A",
													cursor: "pointer",
													display: "block",
												}}
											>
												Save card details
											</Label>
											<p
												style={{
													fontSize: "12px",
													fontWeight: 400,
													color: "#90A4AE",
													marginTop: "2px",
												}}
											>
												*Your payment is secure and encrypted
											</p>
										</div>
									</div>

									{/* Payment Logos */}
									<div className="flex gap-4 mt-4">
										<div
											style={{
												width: "60px",
												height: "40px",
												background: "#FFFFFF",
												border: "1px solid #E0E0E0",
												borderRadius: "8px",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												padding: "8px",
											}}
											data-testid="logo-visa"
										>
											<svg
												width="40"
												height="13"
												viewBox="0 0 40 13"
												fill="none"
											>
												<text
													x="20"
													y="10"
													textAnchor="middle"
													style={{
														fontSize: "10px",
														fontWeight: 700,
														fill: "#1A1F71",
													}}
												>
													VISA
												</text>
											</svg>
										</div>
										<div
											style={{
												width: "60px",
												height: "40px",
												background: "#FFFFFF",
												border: "1px solid #E0E0E0",
												borderRadius: "8px",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												padding: "8px",
											}}
											data-testid="logo-mastercard"
										>
											<div className="flex">
												<div
													style={{
														width: "14px",
														height: "14px",
														borderRadius: "50%",
														background: "#EB001B",
													}}
												/>
												<div
													style={{
														width: "14px",
														height: "14px",
														borderRadius: "50%",
														background: "#F79E1B",
														marginLeft: "-6px",
													}}
												/>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Continue Payment Button */}
							<Button
								onClick={handleContinuePayment}
								className="w-full mt-8"
								style={{
									background: "#00856F",
									color: "#FFFFFF",
									fontWeight: 600,
									fontSize: "16px",
									borderRadius: "12px",
									padding: "16px",
									height: "auto",
								}}
								data-testid="button-continue-payment"
							>
								Continue Payment
							</Button>
						</Card>

						{/* Order Details Section */}
						<Card
							className="p-8"
							style={{
								background: "#FFFFFF",
								borderRadius: "16px",
								border: "1px solid rgba(0, 0, 0, 0.1)",
								height: "fit-content",
							}}
							data-testid="card-order-details"
						>
							<h2
								style={{
									fontSize: "20px",
									fontWeight: 600,
									color: "#00856F",
									marginBottom: "16px",
								}}
								data-testid="text-order-details-title"
							>
								Order Details
							</h2>

							{/* Date */}
							<div className="flex justify-between mb-6">
								<span
									style={{
										fontSize: "14px",
										fontWeight: 500,
										color: "#546E7A",
									}}
								>
									Date
								</span>
								<span
									style={{
										fontSize: "14px",
										fontWeight: 500,
										color: "#00453A",
									}}
									data-testid="text-order-date"
								>
									{paymentDetails.date}
								</span>
							</div>

							{/* Product Details */}
							<div className="mb-6">
								<h3
									style={{
										fontSize: "16px",
										fontWeight: 600,
										color: "#00453A",
										marginBottom: "12px",
									}}
									data-testid="text-product-details-title"
								>
									Product Details
								</h3>
								<div className="space-y-3">
									{paymentDetails.orderItems.map((item) => (
										<div key={item.id} className="flex justify-between">
											<span
												style={{
													fontSize: "14px",
													fontWeight: 400,
													color: "#546E7A",
												}}
												data-testid={`text-product-${item.id}`}
											>
												{item.name}
											</span>
											<span
												style={{
													fontSize: "14px",
													fontWeight: 500,
													color: "#00453A",
												}}
												data-testid={`text-price-${item.id}`}
											>
												Rs {formatPrice(item.price)}
											</span>
										</div>
									))}
								</div>
							</div>

							{/* Total */}
							<div
								className="pt-4"
								style={{
									borderTop: "1px solid #E0E0E0",
								}}
							>
								<div className="flex justify-between">
									<span
										style={{
											fontSize: "16px",
											fontWeight: 600,
											color: "#00453A",
										}}
									>
										Total
									</span>
									<span
										style={{
											fontSize: "16px",
											fontWeight: 700,
											color: "#00453A",
										}}
										data-testid="text-order-total"
									>
										Rs {formatPrice(paymentDetails.total)}
									</span>
								</div>
							</div>
						</Card>
					</div>
				</div>
			</main>
		</div>
	);
}
