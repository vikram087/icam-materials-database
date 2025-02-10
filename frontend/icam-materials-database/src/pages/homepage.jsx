import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/homepage.css";
import Search from "../components/search.jsx";
import NavBar from "../components/navbar.jsx";

function HomePage() {
	const currentDate = new Date();
	const now = currentDate.toISOString().slice(0, 10).replaceAll(/-/g, "");

	const navigate = useNavigate();

	const goToSearch = (query, page, term) => {
		let quer = query;
		if (query === "") {
			quer = "all";
		}

		const advStr = encodeURIComponent(
			JSON.stringify([
				{
					term: "all",
					field: term,
					isVector: false,
					operator: "AND",
				},
			]),
		);

		navigate(
			`${page}?page=1&per_page=20&sort=Most-Relevant&date=00000000-${now}&advanced=false&searches=${advStr}`,
		);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<div>
			<NavBar />
			<div className="main">
				<p className="home-title">ICAM Materials Database</p>
				<button
					style={{
						border: "none",
						background: "none",
						paddingBottom: "10px",
					}}
					type="button"
					onClick={() => goToSearch("all", "/papers", "Abstract")}
				>
					<GoTo />
				</button>
				<br />
				<Search
					searchParams={{
						per_page: 20,
						page: 1,
						sorting: "Most-Relevant",
						date: `00000000-${now}`,
						searches: [
							{
								term: "all",
								field: "Abstract",
								isVector: false,
								operator: "AND",
							},
						],
					}}
					to="/papers"
					options={["Abstract", "Title", "Authors", "Category"]}
				/>

				<section className="media-section media-container">
					<div className="media-placeholder">
						<button
							type="button"
							style={{
								cursor: "pointer",
								border: "none",
								background: "none",
								padding: 0,
							}}
							onClick={() => goToSearch("all", "/papers", "Abstract")}
						>
							<img
								alt="Search Papers"
								src="/search-papers.png"
								className="feature-image"
							/>
						</button>
						<button
							type="button"
							style={{
								cursor: "pointer",
								border: "none",
								background: "none",
								padding: 0,
							}}
							onClick={() => goToSearch("all", "/properties", "Material")}
						>
							<img
								alt="Search Materials"
								src="/search-properties.png"
								className="feature-image"
							/>
						</button>
					</div>
				</section>

				<section
					id="features"
					className="features-section homepage-container"
					style={{ marginBottom: "40px" }}
				>
					<h3>Features</h3>
					<div className="features-grid">
						<button
							type="button"
							className="feature-card"
							style={{
								cursor: "pointer",
								border: "none",
								background: "none",
								padding: 0,
							}}
							onClick={() => goToSearch("all", "/papers", "Abstract")}
						>
							<h4>Search Papers</h4>
							<p>
								Leverage advanced AI technology to locate papers based on their
								semantic relevance, offering a more intuitive search experience
								beyond traditional keyword matching.
							</p>
						</button>
						<button
							className="feature-card"
							type="button"
							style={{
								cursor: "pointer",
								border: "none",
								background: "none",
								padding: 0,
							}}
							onClick={() => goToSearch("all", "/properties", "Material")}
						>
							<h4>Search Properties</h4>
							<p>
								Explore research papers through AI-extracted insights, allowing
								you to search by specific materials, synthesis methods, unique
								properties, and potential applications for a deeper
								understanding.
							</p>
						</button>
						<button
							type="button"
							className="feature-card"
							style={{
								cursor: "pointer",
								border: "none",
								background: "none",
								padding: 0,
							}}
							onClick={() => {
								navigate("/favorites");
								window.scrollTo({ top: 0, behavior: "smooth" });
							}}
						>
							<h4>Favorites</h4>
							<p>
								Bookmark and save your favorite papers for quick access anytime,
								all without the need to sign in—perfect for seamless, on-the-go
								research.
							</p>
						</button>
					</div>
				</section>

				<section id="contact" className="contact-section">
					<div className="homepage-container text-center">
						<h3>Get in Touch</h3>
						<p style={{ paddingBottom: "10px" }}>
							Have questions? Reach out to us for more information about our
							platform.
						</p>
						<a
							href="mailto:vpenumarti@ucdavis.edu"
							rel="noopener noreferrer"
							className="cta-button"
						>
							Contact Us
						</a>
					</div>
				</section>

				<section
					id="contribute"
					className="contribute-section homepage-container"
				>
					<h3>Contribute</h3>
					<p>
						Interested in contributing to our platform? Check out our GitHub
						repository to learn more and start collaborating with us.
					</p>
					<a
						href="https://github.com/vikram087/icam-materials-database"
						target="_blank"
						rel="noopener noreferrer"
						className="github-link"
					>
						<img
							src="/github-mark/github-mark.png"
							alt="GitHub"
							className="github-image"
						/>
					</a>
				</section>

				<p>Funded by the Institute for Complex Adaptive Matter</p>
				<p>Thank you to arXiv for use of its open access interoperability.</p>
			</div>
		</div>
	);
}

function GoTo() {
	return (
		<div className="learn-more" type="button">
			<span className="circle" aria-hidden="true">
				<span className="icon arrow" />
			</span>
			<span className="button-text">Search Papers</span>
		</div>
	);
}

export default HomePage;
