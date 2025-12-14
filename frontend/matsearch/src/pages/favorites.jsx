import NavBar from "../components/navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Content from "../components/mathjax";
import { ScrollToBottom, ScrollToTop } from "./papers";
import "../styles/favorites.css";
import Fuse from "fuse.js";

function Favorites({ setPrevUrl, setPaperToUse }) {
	const [highlightedStars, setHighlightedStars] = useState([]);
	const [papersCopy, setPapersCopy] = useState([]);
	const [expandedIndex, setExpandedIndex] = useState(-1);
	const [query, setQuery] = useState("");
	const [needsExpand, setNeedsExpand] = useState({});
	const navigate = useNavigate();

	useEffect(() => {
		setQuery("all");

		const storedStars =
			JSON.parse(localStorage.getItem("highlightedStars")) || [];
		setHighlightedStars(Array.isArray(storedStars) ? storedStars : []);
		setPapersCopy(Array.isArray(storedStars) ? storedStars : []);
	}, []);

	useEffect(() => {
		const checkExpand = {};
		highlightedStars.forEach((paper, index) => {
			const element = document.getElementById(`abstract-fav-${paper.id}`);
			if (element) {
				checkExpand[index] = element.scrollHeight > element.clientHeight;
			}
		});
		setNeedsExpand(checkExpand);
	}, [highlightedStars]);

	const changePaper = (paper) => {
		const id = paper.id.replace("/-/g", "/");
		setPaperToUse(paper);
		setPrevUrl("/favorites");
		navigate(`/paper/${id}`);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const toggleStar = (paper) => {
		setHighlightedStars((prev) => {
			const isStarred = prev.some((p) => p.id === paper.id);

			const newStars = isStarred
				? prev.filter((p) => p.id !== paper.id)
				: [...prev, paper];

			localStorage.setItem("highlightedStars", JSON.stringify(newStars));
			return newStars;
		});
	};

	const toggleExpand = (index) => {
		if (expandedIndex === index) {
			setExpandedIndex(-1);
		} else {
			setExpandedIndex(index);
		}
	};

	const numToDate = (date) => {
		const monthsReversed = {
			"01": "January,",
			"02": "February,",
			"03": "March,",
			"04": "April,",
			"05": "May,",
			"06": "June,",
			"07": "July,",
			"08": "August,",
			"09": "September,",
			10: "October,",
			11: "November,",
			12: "December,",
		};

		const year = date.substring(0, 4);
		const month = monthsReversed[date.substring(4, 6)];
		const day = date.substring(6);

		return `${day} ${month} ${year}`;
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<NavBar />
			<div className="px-6 lg:px-10 py-12">
				{/* Page Header */}
				<div className="mb-8 lg:mb-12">
					<FavoritesSearch
						papers={highlightedStars}
						setPapers={setHighlightedStars}
						papersCopy={papersCopy}
						setQuery={setQuery}
					/>
				</div>

				{/* Results Info */}
				{highlightedStars.length > 0 && (
					<div className="bg-gray-50 border border-gray-200 rounded-lg p-4 lg:p-6 mb-6">
						<div className="flex items-center gap-2 text-sm lg:text-base text-gray-700">
							<svg
								className="w-5 h-5 text-amber-500"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<title>Star</title>
								<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
							</svg>
							<span>
								<span className="font-semibold">{highlightedStars.length}</span>{" "}
								saved paper{highlightedStars.length !== 1 ? "s" : ""}
							</span>
							{query !== "all" && (
								<>
									<span className="text-gray-400">•</span>
									<span>
										Displaying results for:{" "}
										<span className="font-semibold text-slate-900">
											"{query}"
										</span>
									</span>
								</>
							)}
						</div>
					</div>
				)}

				{/* Papers List */}
				{highlightedStars.length > 0 ? (
					<div className="space-y-4 lg:space-y-6">
						{highlightedStars.map((paper, index) => (
							<div key={`${paper.id}_favs`}>
								{/* Title and Star */}
								<div className="flex items-start justify-between gap-4 mb-3">
									<button
										type="button"
										onClick={() => changePaper(paper)}
										className="cursor-pointer flex-1 text-left group"
									>
										<h3 className="font-serif text-lg lg:text-xl font-bold text-slate-900 group-hover:text-red-500 transition-colors duration-300 leading-snug">
											<Content content={paper.title} />
										</h3>
									</button>
									<button
										type="button"
										onClick={() => toggleStar(paper)}
										className="shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-300"
										aria-label="Remove from favorites"
									>
										<svg
											className="w-5 h-5 text-amber-500"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<title>Star</title>
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
										</svg>
									</button>
								</div>

								{/* Authors and Date */}
								<p className="text-sm lg:text-base text-gray-600 mb-4">
									by{" "}
									{paper.authors.map((author, idx) => (
										<span key={`${paper.id}_authors_${idx}`}>
											<em className="font-medium">{author}</em>
											{idx < paper.authors.length - 1 ? ", " : ""}
										</span>
									))}{" "}
									<span className="text-gray-400">—</span>{" "}
									<span className="text-gray-500">
										{numToDate(String(paper.date))}
									</span>
								</p>

								{/* Abstract */}
								<div className="relative">
									<div
										id={`abstract-fav-${paper.id}`}
										className={`text-gray-700 leading-relaxed text-sm lg:text-base ${
											expandedIndex === index ? "" : "line-clamp-3"
										}`}
									>
										<Content content={paper.summary} />
									</div>
									{needsExpand[index] && (
										<button
											type="button"
											onClick={() => toggleExpand(index)}
											className="mt-2 text-sm font-semibold text-red-500 hover:text-red-600 transition-colors duration-300 flex items-center gap-1"
										>
											{expandedIndex === index ? (
												<>
													Show Less
													<svg
														className="w-4 h-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<title>Show less</title>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M5 15l7-7 7 7"
														/>
													</svg>
												</>
											) : (
												<>
													Show More
													<svg
														className="w-4 h-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<title>Show More</title>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M19 9l-7 7-7-7"
														/>
													</svg>
												</>
											)}
										</button>
									)}
								</div>

								{/* Materials */}
								{paper.MAT !== "N/A" && (
									<div className="mt-4 pt-4 border-t border-gray-200">
										<div className="flex flex-wrap items-start gap-2">
											<span className="font-semibold text-sm text-gray-700 flex items-center gap-1">
												<svg
													className="w-4 h-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<title>Materials</title>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
													/>
												</svg>
												Materials:
											</span>
											<div className="flex flex-wrap gap-2">
												{paper.MAT.map((item, idx) => (
													<span
														key={`${idx}_${item}`}
														className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
													>
														{item}
													</span>
												))}
											</div>
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-16 lg:py-24">
						<div className="max-w-md text-center">
							<svg
								className="w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-6 text-gray-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>No favorites</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
								/>
							</svg>
							<h3 className="font-serif text-2xl font-bold text-slate-900 mb-3">
								No Favorites Yet
							</h3>
							<p className="text-gray-600 text-base mb-6">
								Start saving papers by clicking the star icon on any research
								paper.
							</p>
							<button
								onClick={() => navigate("/papers")}
								className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 hover:shadow-lg transition-all duration-300"
								type="button"
							>
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Browse</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
								Browse Papers
							</button>
						</div>
					</div>
				)}

				{/* Scroll Buttons */}
				<ScrollToTop />
				<ScrollToBottom />
			</div>
		</div>
	);
}

function FavoritesSearch({ papers, setPapers, papersCopy, setQuery }) {
	const [inputValue, setInputValue] = useState("");

	const goToSearch = (query) => {
		if (!papers) {
			setQuery(query);
			if (query === "") {
				setQuery("all");
			}
			return;
		}
		if (query === "" || query === "all") {
			setQuery("all");
			setPapers(papersCopy);
			return;
		}
		setQuery(query);

		const options = {
			keys: papers[0] ? Object.keys(papers[0]) : [],
			threshold: 0.3,
		};

		const fuse = new Fuse(papersCopy, options);
		const result = fuse.search(query);
		setPapers(result.map(({ item }) => item));
	};

	const handleChange = (event) => {
		const value = event.target.value;
		setInputValue(value);
		goToSearch(value);
	};

	const clearSearch = () => {
		setInputValue("");
		goToSearch("");
	};

	return (
		<div className="w-full max-w-3xl mx-auto">
			<div className="h-20" />
			<div className="relative">
				<div className="flex gap-3">
					<div className="relative flex-1">
						<input
							type="text"
							value={inputValue}
							onChange={handleChange}
							placeholder="Search your favorites..."
							className="w-full px-5 py-3.5 pr-12 text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all duration-300 placeholder:text-gray-400"
						/>
						{inputValue ? (
							<button
								type="button"
								onClick={clearSearch}
								className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
								aria-label="Clear search"
							>
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Clear Search</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						) : (
							<div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Search</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default Favorites;
