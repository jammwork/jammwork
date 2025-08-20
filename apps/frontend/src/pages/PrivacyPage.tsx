import { Button } from "@jammwork/ui";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

function PrivacyPage() {
	return (
		<div className="min-h-screen w-screen bg-background">
			<div className="max-w-4xl mx-auto px-6 py-8">
				<div className="mb-8">
					<Link to="/">
						<Button variant="outline" size="sm" className="mb-4">
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back to Home
						</Button>
					</Link>
					<h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
					<p className="text-muted-foreground">
						Last updated: {new Date().toLocaleDateString()}
					</p>
				</div>

				<div className="prose prose-slate max-w-none">
					<section className="mb-8">
						<h2 className="text-2xl font-semibold mb-4">Introduction</h2>
						<p className="mb-4">
							Jammwork ("we," "our," or "us") is committed to protecting your
							privacy. This Privacy Policy explains how we collect, use, and
							safeguard your information when you use our collaborative canvas
							application.
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold mb-4">
							Information We Collect
						</h2>
						<h3 className="text-lg font-medium mb-2">
							Information You Provide
						</h3>
						<ul className="list-disc list-inside mb-4 space-y-1">
							<li>Account information (username, email if provided)</li>
							<li>Content you create on the canvas (drawings, text, shapes)</li>
							<li>Collaboration data when working with others</li>
						</ul>

						<h3 className="text-lg font-medium mb-2">
							Automatically Collected Information
						</h3>
						<ul className="list-disc list-inside mb-4 space-y-1">
							<li>Usage data and analytics</li>
							<li>Device and browser information</li>
							<li>IP address and location data</li>
						</ul>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold mb-4">
							How We Use Your Information
						</h2>
						<ul className="list-disc list-inside mb-4 space-y-1">
							<li>To provide and improve our services</li>
							<li>To enable real-time collaboration features</li>
							<li>To communicate with you about updates and features</li>
							<li>To ensure security and prevent abuse</li>
						</ul>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold mb-4">Data Sharing</h2>
						<p className="mb-4">
							We do not sell, trade, or rent your personal information to third
							parties. We may share information only in the following
							circumstances:
						</p>
						<ul className="list-disc list-inside mb-4 space-y-1">
							<li>With your explicit consent</li>
							<li>To comply with legal obligations</li>
							<li>To protect our rights and prevent fraud</li>
							<li>With service providers who assist in our operations</li>
						</ul>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold mb-4">Data Security</h2>
						<p className="mb-4">
							We implement appropriate security measures to protect your
							information against unauthorized access, alteration, disclosure,
							or destruction. However, no method of transmission over the
							internet is 100% secure.
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
						<p className="mb-4">You have the right to:</p>
						<ul className="list-disc list-inside mb-4 space-y-1">
							<li>Access your personal data</li>
							<li>Correct inaccurate information</li>
							<li>Delete your account and associated data</li>
							<li>Export your data</li>
							<li>Opt out of certain communications</li>
						</ul>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
						<p className="mb-4">
							If you have any questions about this Privacy Policy or our
							practices, please contact us at{" "}
							<a
								href="mailto:privacy@jammwork.com"
								className="text-blue-600 hover:underline"
							>
								privacy@jammwork.com
							</a>
						</p>
					</section>

					<section className="mb-8">
						<h2 className="text-2xl font-semibold mb-4">
							Changes to This Policy
						</h2>
						<p className="mb-4">
							We may update this Privacy Policy from time to time. We will
							notify you of any changes by posting the new Privacy Policy on
							this page and updating the "Last updated" date.
						</p>
					</section>
				</div>
			</div>
		</div>
	);
}

export default PrivacyPage;
