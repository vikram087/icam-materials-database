import { useNavigate } from "react-router-dom";
import "../styles/homepage.css";
import NavBar from "../components/navbar";

function HomePage() {
	const currentDate = new Date();
	const now = currentDate.toISOString().slice(0, 10).replaceAll(/-/g, "");
	const navigate = useNavigate();

	const goToSearch = (query, page, term) => {
		const quer = query === "" ? "all" : query;
		const advStr = encodeURIComponent(
			JSON.stringify([
				{
					term: quer,
					field: term,
					isVector: false,
					operator: "AND",
				},
			]),
		);

		navigate(
			`${page}?page=1&per_page=20&sort=Most-Relevant&date=00000000-${now}&searches=${advStr}`,
		);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<div className="min-h-screen bg-white overflow-x-hidden">
			<NavBar />

			{/* Hero Section */}
			<section className="relative pt-32 lg:pt-40 pb-16 lg:pb-24 px-6 lg:px-10 overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
				{/* Decorative Elements */}
				<div className="hero-decoration">
					<div className="decoration-circle"></div>
					<div className="decoration-grid"></div>
				</div>

				<div className="max-w-7xl mx-auto relative z-10">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
						{/* Hero Content */}
						<div className="animate-slide-in-left">
							<h1 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 mb-4 lg:mb-6 leading-tight tracking-tight">
								Matsearch
							</h1>
							<p className="text-base lg:text-lg text-gray-600 mb-8 lg:mb-16 leading-relaxed max-w-xl">
								Semantic search powered by advanced AI, connecting researchers
								to breakthrough discoveries in materials science and quantum
								matter.
							</p>

							{/* Stats */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 pt-8 lg:pt-10 border-t border-gray-200">
								<div>
									<div className="font-serif text-3xl lg:text-4xl font-bold text-slate-900 mb-1 lg:mb-2">
										10K+
									</div>
									<div className="text-sm text-gray-600 font-medium">
										Research Papers
									</div>
								</div>
								<div>
									<div className="font-serif text-3xl lg:text-4xl font-bold text-slate-900 mb-1 lg:mb-2">
										AI
									</div>
									<div className="text-sm text-gray-600 font-medium">
										Semantic Search
									</div>
								</div>
								<div>
									<div className="font-serif text-3xl lg:text-4xl font-bold text-slate-900 mb-1 lg:mb-2">
										Live
									</div>
									<div className="text-sm text-gray-600 font-medium">
										arXiv Integration
									</div>
								</div>
							</div>
						</div>

						{/* Search Panel */}
						<div className="animate-slide-in-right bg-white rounded-xl p-6 lg:p-10 shadow-elegant border border-gray-200">
							<div className="mb-6 lg:mb-8">
								<h3 className="font-serif text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
									Begin Your Research
								</h3>
								<p className="text-gray-600 text-sm lg:text-base">
									Search across thousands of materials science publications
								</p>
							</div>

							{/* Search Tabs */}
							<div className="flex gap-2 mb-6 lg:mb-8 bg-gray-100 p-1 rounded-lg">
								<button
									type="button"
									onClick={() => goToSearch("all", "/papers", "Abstract")}
									className="hover:shadow-sm hover:bg-white flex-1 flex items-center justify-center gap-2 px-3 lg:px-4 py-2 lg:py-3 text-slate-900 rounded-md font-semibold text-sm lg:text-base transition-all duration-300"
								>
									<svg
										className="w-4 h-4 lg:w-5 lg:h-5"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth={2}
									>
										<title>Papers</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
									Papers
								</button>
								<button
									type="button"
									onClick={() => goToSearch("all", "/properties", "Material")}
									className="hover:shadow-sm hover:bg-white flex-1 flex items-center justify-center gap-2 px-3 lg:px-4 py-2 lg:py-3 bg-transparent text-gray-600 rounded-md font-semibold text-sm lg:text-base transition-all duration-300"
								>
									<svg
										className="w-4 h-4 lg:w-5 lg:h-5"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth={2}
									>
										<title>Materials</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
										/>
									</svg>
									Materials
								</button>
							</div>

							{/* Quick Search */}
							<div className="flex flex-col sm:flex-row gap-2 lg:gap-4 mb-4 lg:mb-6">
								<input
									type="text"
									placeholder="e.g., superconductivity, quantum materials..."
									className="flex-1 px-4 lg:px-6 py-3 lg:py-4 border-2 border-gray-200 rounded-lg text-sm lg:text-base focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all duration-300"
									onKeyPress={(e) => {
										if (e.key === "Enter") {
											goToSearch(e.target.value, "/papers", "Abstract");
										}
									}}
								/>
								<button
									type="button"
									onClick={(e) => {
										const input =
											e.currentTarget.parentElement.querySelector("input");
										goToSearch(input.value, "/papers", "Abstract");
									}}
									className="px-6 lg:px-8 py-3 lg:py-4 bg-slate-900 text-white rounded-lg font-semibold text-sm lg:text-base hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 whitespace-nowrap"
								>
									Search
								</button>
							</div>

							{/* Search Suggestions */}
							<div className="flex items-center gap-2 lg:gap-3 flex-wrap">
								<span className="text-xs lg:text-sm text-gray-600 font-semibold">
									Popular:
								</span>
								<button
									type="button"
									onClick={() =>
										goToSearch("superconductivity", "/papers", "Abstract")
									}
									className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm bg-transparent border border-gray-200 rounded-full text-gray-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300"
								>
									Superconductivity
								</button>
								<button
									type="button"
									onClick={() =>
										goToSearch("quantum materials", "/papers", "Abstract")
									}
									className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm bg-transparent border border-gray-200 rounded-full text-gray-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300"
								>
									Quantum Materials
								</button>
								<button
									type="button"
									onClick={() => goToSearch("graphene", "/papers", "Abstract")}
									className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm bg-transparent border border-gray-200 rounded-full text-gray-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300"
								>
									Graphene
								</button>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Showcase */}
			<section className="py-14 px-6 lg:px-10 bg-white">
				<div className="max-w-7xl mx-auto">
					{/* Section Header */}
					<div className="text-center mb-12 lg:mb-20">
						<h2 className="font-serif text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 mb-4 lg:mb-6 tracking-tight">
							Research Tools
						</h2>
						<p className="text-base lg:text-lg xl:text-xl text-gray-600 max-w-2xl mx-auto">
							Advanced capabilities designed for modern materials research
						</p>
					</div>

					{/* Features Grid */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
						{/* Large Feature */}
						<div className="feature-large-card rounded-2xl p-8 lg:p-12 text-white flex flex-col justify-between relative overflow-hidden">
							<div className="relative z-10">
								<div>
									<h3 className="font-serif text-3xl lg:text-4xl font-bold mb-4 lg:mb-6 tracking-tight">
										Semantic Understanding
									</h3>
									<p className="text-base lg:text-lg leading-relaxed mb-6 lg:mb-8 opacity-95">
										Our AI doesn't just match keywords—it understands context,
										methodology, and scientific relationships. Search by
										concept, not just terminology.
									</p>
									<button
										type="button"
										onClick={() => goToSearch("all", "/papers", "Abstract")}
										className="inline-flex items-center gap-3 px-6 lg:px-8 py-3 lg:py-4 bg-white text-slate-900 rounded-lg font-semibold text-sm lg:text-base hover:translate-x-1 hover:shadow-lg transition-all duration-300"
									>
										Explore Papers
										<svg
											className="w-4 h-4 lg:w-5 lg:h-5"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<title>Explore Papers</title>
											<path
												fillRule="evenodd"
												d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
												clipRule="evenodd"
											/>
										</svg>
									</button>
								</div>
							</div>
						</div>

						{/* Small Feature Cards */}
						<div className="animate-fade-in-up-delay-1 bg-gray-50 rounded-xl p-6 lg:p-8 border border-gray-200 hover:border-red-500 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
							<div className="w-12 h-12 lg:w-14 lg:h-14 bg-white rounded-lg flex items-center justify-center mb-4 lg:mb-6 border border-gray-200">
								<svg
									className="w-6 h-6 lg:w-7 lg:h-7 text-red-500"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth={2}
								>
									<title>Properties</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
							</div>
							<h4 className="font-serif text-xl lg:text-2xl font-bold text-slate-900 mb-2 lg:mb-3">
								Material Properties
							</h4>
							<p className="text-sm lg:text-base text-gray-600 leading-relaxed">
								AI-extracted synthesis methods, properties, and applications
							</p>
						</div>

						<div className="animate-fade-in-up-delay-2 bg-gray-50 rounded-xl p-6 lg:p-8 border border-gray-200 hover:border-red-500 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
							<div className="w-12 h-12 lg:w-14 lg:h-14 bg-white rounded-lg flex items-center justify-center mb-4 lg:mb-6 border border-gray-200">
								<svg
									className="w-6 h-6 lg:w-7 lg:h-7 text-red-500"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth={2}
								>
									<title>Updates</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M13 10V3L4 14h7v7l9-11h-7z"
									/>
								</svg>
							</div>
							<h4 className="font-serif text-xl lg:text-2xl font-bold text-slate-900 mb-2 lg:mb-3">
								Real-Time Updates
							</h4>
							<p className="text-sm lg:text-base text-gray-600 leading-relaxed">
								Direct integration with arXiv for latest publications
							</p>
						</div>

						<div className="animate-fade-in-up-delay-3 bg-gray-50 rounded-xl p-6 lg:p-8 border border-gray-200 hover:border-red-500 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
							<div className="w-12 h-12 lg:w-14 lg:h-14 bg-white rounded-lg flex items-center justify-center mb-4 lg:mb-6 border border-gray-200">
								<svg
									className="w-6 h-6 lg:w-7 lg:h-7 text-red-500"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth={2}
								>
									<title>Favorites</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
									/>
								</svg>
							</div>
							<h4 className="font-serif text-xl lg:text-2xl font-bold text-slate-900 mb-2 lg:mb-3">
								Personal Library
							</h4>
							<p className="text-sm lg:text-base text-gray-600 leading-relaxed">
								Save and organize research without sign-in required
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Research Areas */}
			<section className="py-14 px-6 lg:px-10 bg-gray-50">
				<div className="max-w-7xl mx-auto">
					<h2 className="font-serif text-4xl lg:text-5xl font-bold text-slate-900 mb-12 lg:mb-16 text-center tracking-tight">
						Research Domains
					</h2>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
						{[
							{
								title: "Quantum Materials",
								topics: [
									"Topological Insulators",
									"Quantum Spin Liquids",
									"High-Tc Superconductors",
								],
							},
							{
								title: "Condensed Matter",
								topics: [
									"Phase Transitions",
									"Electronic Structure",
									"Correlated Systems",
								],
							},
							{
								title: "Nanomaterials",
								topics: ["2D Materials", "Nanostructures", "Carbon Allotropes"],
							},
							{
								title: "Energy Materials",
								topics: [
									"Photovoltaics",
									"Battery Materials",
									"Thermoelectrics",
								],
							},
						].map((area, idx) => (
							<div
								key={`${idx}_${area.title}`}
								className="bg-white rounded-xl p-6 lg:p-10 border border-gray-200 hover:border-red-500 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
							>
								<h3 className="font-serif text-xl lg:text-2xl font-bold text-slate-900 mb-4 lg:mb-6 pb-3 lg:pb-4 border-b-2 border-gray-200">
									{area.title}
								</h3>
								<ul className="space-y-2 lg:space-y-3">
									{area.topics.map((topic) => (
										<li key={area.topics?.[0]}>
											<button
												type="button"
												onClick={() => goToSearch(topic, "/papers", "Abstract")}
												className="topic-link text-sm lg:text-base text-gray-600 hover:text-red-500 hover:translate-x-1 transition-all duration-300"
											>
												{topic}
											</button>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* About Section */}
			<section className="py-14 px-6 lg:px-10 bg-white">
				<div className="max-w-7xl mx-auto">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
						<div>
							<h2 className="font-serif text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-900 mb-6 lg:mb-8 tracking-tight">
								About the Platform
							</h2>
							<p className="text-base lg:text-lg text-gray-700 mb-4 lg:mb-6 leading-relaxed">
								Developed in collaboration with the Institute for Complex
								Adaptive Matter, this platform represents the future of
								scientific research discovery. By leveraging advanced natural
								language processing and machine learning, we've created a tool
								that understands the nuances of materials science research.
							</p>
							<p className="text-base lg:text-lg text-gray-700 leading-relaxed">
								Our semantic search goes beyond simple keyword matching,
								understanding the relationships between concepts, methodologies,
								and findings to surface the most relevant research for your
								work.
							</p>
						</div>

						<div className="flex items-center justify-center min-h-75 lg:min-h-100 bg-gray-50 rounded-xl border border-gray-200">
							<svg viewBox="0 0 200 200" className="w-64 h-64 lg:w-80 lg:h-80">
								<title>Matsearch</title>
								<rect
									x="20"
									y="20"
									width="60"
									height="60"
									fill="#1a1a2e"
									opacity="0.8"
								/>
								<rect
									x="90"
									y="20"
									width="60"
									height="60"
									fill="#16213e"
									opacity="0.6"
								/>
								<rect
									x="160"
									y="20"
									width="20"
									height="60"
									fill="#0f3460"
									opacity="0.9"
								/>
								<rect
									x="20"
									y="90"
									width="60"
									height="60"
									fill="#0f3460"
									opacity="0.7"
								/>
								<rect
									x="90"
									y="90"
									width="60"
									height="60"
									fill="#e94560"
									opacity="0.8"
								/>
								<rect
									x="160"
									y="90"
									width="20"
									height="60"
									fill="#1a1a2e"
									opacity="0.5"
								/>
								<rect
									x="20"
									y="160"
									width="20"
									height="20"
									fill="#16213e"
									opacity="0.9"
								/>
								<rect
									x="50"
									y="160"
									width="30"
									height="20"
									fill="#0f3460"
									opacity="0.6"
								/>
								<rect
									x="90"
									y="160"
									width="60"
									height="20"
									fill="#1a1a2e"
									opacity="0.8"
								/>
								<rect
									x="160"
									y="160"
									width="20"
									height="20"
									fill="#e94560"
									opacity="0.7"
								/>
							</svg>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="relative py-14 px-6 lg:px-10 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
				<div className="cta-pattern"></div>

				<div className="max-w-4xl mx-auto text-center relative z-10">
					<h2 className="font-serif text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 lg:mb-6 tracking-tight">
						Ready to Accelerate Your Research?
					</h2>
					<p className="text-lg lg:text-xl mb-8 lg:mb-12 opacity-95">
						Join researchers worldwide discovering breakthrough materials
						science.
					</p>

					<div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center">
						<button
							type="button"
							onClick={() => goToSearch("all", "/papers", "Abstract")}
							className="px-8 lg:px-12 py-3 lg:py-4 bg-white text-slate-900 rounded-lg font-semibold text-base lg:text-lg hover:-translate-y-0.5 hover:shadow-2xl transition-all duration-300"
						>
							Start Searching
						</button>
						<a
							href="https://github.com/vikram087/matsearch"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-3 px-8 lg:px-12 py-3 lg:py-4 bg-transparent text-white border-2 border-white rounded-lg font-semibold text-base lg:text-lg hover:bg-white hover:text-slate-900 transition-all duration-300"
						>
							<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
								<title>Github</title>
								<path
									fillRule="evenodd"
									d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
									clipRule="evenodd"
								/>
							</svg>
							View on GitHub
						</a>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-slate-900 text-white py-12 px-6 lg:px-10">
				<div className="max-w-7xl mx-auto">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12 lg:mb-16 pb-12 lg:pb-16 border-b border-white/10">
						<div className="font-serif text-2xl lg:text-3xl font-bold mb-3 lg:mb-4">
							Matsearch
						</div>

						{/* Platform Links */}
						<div>
							<h4 className="font-serif text-lg lg:text-xl font-bold mb-4 lg:mb-6">
								Platform
							</h4>
							<div className="space-y-2 lg:space-y-3">
								<button
									type="button"
									onClick={() => goToSearch("all", "/papers", "Abstract")}
									className="block text-white/70 hover:text-white hover:translate-x-1 transition-all duration-300 text-sm lg:text-base"
								>
									Search Papers
								</button>
								<button
									type="button"
									onClick={() => goToSearch("all", "/properties", "Material")}
									className="block text-white/70 hover:text-white hover:translate-x-1 transition-all duration-300 text-sm lg:text-base"
								>
									Material Properties
								</button>
								<button
									type="button"
									onClick={() => navigate("/favorites")}
									className="block text-white/70 hover:text-white hover:translate-x-1 transition-all duration-300 text-sm lg:text-base"
								>
									Favorites
								</button>
							</div>
						</div>

						{/* Resources */}
						<div>
							<h4 className="font-serif text-lg lg:text-xl font-bold mb-4 lg:mb-6">
								Resources
							</h4>
							<div className="space-y-2 lg:space-y-3">
								<a
									href="https://github.com/vikram087/matsearch"
									target="_blank"
									rel="noopener noreferrer"
									className="block text-white/70 hover:text-white hover:translate-x-1 transition-all duration-300 text-sm lg:text-base"
								>
									Documentation
								</a>
								<a
									href="https://github.com/vikram087/matsearch"
									target="_blank"
									rel="noopener noreferrer"
									className="block text-white/70 hover:text-white hover:translate-x-1 transition-all duration-300 text-sm lg:text-base"
								>
									GitHub
								</a>
								<a
									href="mailto:vpenumarti@ucdavis.edu"
									className="block text-white/70 hover:text-white hover:translate-x-1 transition-all duration-300 text-sm lg:text-base"
								>
									Contact
								</a>
							</div>
						</div>

						{/* Acknowledgments */}
						<div>
							<h4 className="font-serif text-lg lg:text-xl font-bold mb-4 lg:mb-6">
								Acknowledgments
							</h4>
							<p className="text-white/60 text-sm lg:text-base leading-relaxed mb-2 lg:mb-3">
								Funded by the Institute for Complex Adaptive Matter
							</p>
							<p className="text-white/60 text-sm lg:text-base leading-relaxed">
								Thank you to arXiv for use of its open access interoperability
							</p>
						</div>
					</div>

					<div className="text-center">
						<p className="text-white/50 text-sm lg:text-base">
							© 2024 Matsearch. All rights reserved.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}

export default HomePage;
