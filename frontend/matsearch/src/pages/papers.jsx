import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TailSpin } from "react-loader-spinner";
import Search from "../components/search.jsx";
import Content from "../components/mathjax.jsx";
import Pagination from "../components/pagination.jsx";
import "../styles/papers.css";
import NavBar from "../components/navbar.jsx";

function Papers({ searchParams, setSearchParams, setPrevUrl, setPaperToUse }) {
	const location = useLocation();

	const [papers, setPapers] = useState([]);
	const [pageCount, setPageCount] = useState(0);
	const [expandedIndex, setExpandedIndex] = useState(-1);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [time, setTime] = useState("");
	const [highlightedStars, setHighlightedStars] = useState([]);
	const [inflated, setInflated] = useState(-1);
	const [searchQuery, setSearchQuery] = useState("");

	const navigate = useNavigate();

	const toggleExpand = (index) => {
		if (expandedIndex === index) {
			setExpandedIndex(-1);
		} else {
			setExpandedIndex(index);
		}
	};

	const getPapers = (
		page,
		results,
		sorting,
		startTime,
		dateRange,
		searches,
	) => {
		const backend_url = import.meta.env.VITE_BACKEND_URL;

		fetch(`${backend_url}/papers`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				page: page,
				results: results,
				sorting: sorting,
				date: dateRange,
				searches: searches,
			}),
		})
			.then((response) => response.json())
			.then((data) => {
				const endTime = performance.now();

				const totalTimeS = (endTime - startTime) / 1000;
				const totalTime = totalTimeS.toFixed(2);

				setTime(totalTime);
				setLoading(false);

				setExpandedIndex(-1);
				setPapers(data.papers);
				setTotal(data.total);
				setPageCount(Math.ceil(data.total / searchParams.per_page));
				setInflated(data.inflated);
			})
			.catch(() => {
				setExpandedIndex(-1);
				setTotal(0);
				setPapers([]);
				setPageCount(0);
				setInflated(-1);
			});
	};

	useEffect(() => {
		const query = new URLSearchParams(location.search);
		const page = Number(query.get("page")) || searchParams.page;
		const perPage = Number(query.get("per_page")) || searchParams.per_page;
		const sorting = query.get("sort") || searchParams.sorting;
		const date = query.get("date") || searchParams.date;
		const searches =
			JSON.parse(decodeURIComponent(query.get("searches"))) ||
			searchParams.searches;

		const storedStars =
			JSON.parse(localStorage.getItem("highlightedStars")) || [];
		setHighlightedStars(Array.isArray(storedStars) ? storedStars : []);

		setSearchParams({
			per_page: perPage,
			page: page,
			sorting: sorting,
			date: date,
			searches: searches,
		});

		setSearchQuery(parseSearchQuery(searches));

		const startTime = performance.now();

		setLoading(true);

		getPapers(page, perPage, sorting, startTime, date, searches);
	}, [location.search]);

	const changePage = (page) => {
		setSearchParams((prevParams) => ({
			...prevParams,
			page: page,
		}));

		const advStr = encodeURIComponent(JSON.stringify(searchParams.searches));

		navigate(
			`?page=${page}&per_page=${searchParams.per_page}` +
				`&sort=${searchParams.sorting}` +
				`&${searchParams.date}&searches=${advStr}`,
		);
	};

	const changePaper = (paper) => {
		const id = paper.id.replace("/-/g", "/");

		const advStr = encodeURIComponent(JSON.stringify(searchParams.searches));

		const papers =
			`/papers?page=${searchParams.page}&per_page=${searchParams.per_page}` +
			`&sort=${searchParams.sorting}` +
			`&${searchParams.date}&${advStr}`;

		setPrevUrl(papers);
		setPaperToUse(paper);
		navigate(`/paper/${id}`);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handlePageClick = (pageNumber) => {
		setPapers([]);
		changePage(pageNumber);
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

	function parseSearchQuery(conditions) {
		return conditions
			.map(({ term, field, operator, isVector }) => {
				let prefix = "";
				if (isVector) {
					prefix = "VECTOR";
				} else if (operator === "") {
					prefix = "AND ";
				} else {
					prefix = operator;
				}

				return `(${prefix} ${field.toLowerCase()}: ${term})`;
			})
			.join(" ");
	}

	const chooseBody = () => {
		if (!loading && total === 0) {
			return (
				<div className="flex flex-col items-center justify-center py-16 lg:py-24">
					<div className="max-w-md text-center">
						<svg
							className="w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-6 text-gray-300"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>No results</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<h3 className="font-serif text-2xl font-bold text-slate-900 mb-3">
							No Results Found
						</h3>
						<p className="text-gray-600 text-base">
							Please adjust your search parameters to yield results.
						</p>
					</div>
				</div>
			);
		}

		if (!loading) {
			return (
				<div className="w-full">
					<div className="bg-gray-50 border border-gray-200 rounded-lg p-4 lg:p-6 mb-6 lg:mb-8">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
							<div className="flex items-center gap-2 text-sm lg:text-base text-gray-700">
								<svg
									className="w-5 h-5 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Results</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
								<span className="font-semibold">{total.toLocaleString()}</span>{" "}
								results in <span className="font-semibold">{time}s</span>
								<span className="text-gray-500">({pageCount} pages)</span>
							</div>
						</div>

						<div className="flex items-start gap-2">
							<svg
								className="w-5 h-5 text-gray-400 mt-0.5 shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Display Results</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
							<div>
								<span className="text-sm text-gray-600">
									Displaying results for:{" "}
								</span>
								<span className="font-semibold text-slate-900 text-sm">
									{searchQuery}
								</span>
							</div>
						</div>

						{total >= 10000 && (
							<div className="mt-3 pt-3 border-t border-gray-200">
								<p className="text-sm text-amber-700 flex items-center gap-2">
									<svg
										className="w-4 h-4"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<title>Limited results</title>
										<path
											fillRule="evenodd"
											d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
											clipRule="evenodd"
										/>
									</svg>
									Results limited to first 10,000 matching documents
								</p>
							</div>
						)}

						{inflated !== -1 && (
							<div className="mt-3 pt-3 border-t border-gray-200">
								<p className="text-sm text-blue-700 flex items-center gap-2">
									<svg
										className="w-4 h-4"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<title>Expanded results</title>
										<path
											fillRule="evenodd"
											d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
											clipRule="evenodd"
										/>
									</svg>
									Expanding from {inflated} to 100 results for better coverage
								</p>
							</div>
						)}
					</div>

					{/* Papers List */}
					<div className="space-y-6">
						{papers?.map((paper, index) => (
							<div key={`${paper.id}_papers_body`}>
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
										aria-label={
											highlightedStars.some((p) => p.id === paper.id)
												? "Remove from favorites"
												: "Add to favorites"
										}
									>
										{highlightedStars.some((p) => p.id === paper.id) ? (
											<svg
												className="w-5 h-5 text-amber-500"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<title>Star</title>
												<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
											</svg>
										) : (
											<svg
												className="w-5 h-5 text-gray-400 hover:text-amber-500"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<title>Star</title>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
												/>
											</svg>
										)}
									</button>
								</div>

								{/* Authors and Date */}
								<p className="text-sm lg:text-base text-gray-600 mb-4">
									by{" "}
									{paper.authors.map((author, idx) => (
										<span key={`${paper.id}_authors_papers_${idx}`}>
											<em className="font-medium">
												<Content content={author} mode="highlightOnly" />
											</em>
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
										className={`text-gray-700 leading-relaxed text-sm lg:text-base ${
											expandedIndex === index ? "" : "line-clamp-3"
										}`}
									>
										<Content content={paper.summary} />
									</div>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											toggleExpand(index);
										}}
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
													<title>Show more</title>
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
														<Content content={item} />
													</span>
												))}
											</div>
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			);
		}

		if (loading) {
			return (
				<div className="flex flex-col items-center justify-center py-20 lg:py-32">
					<TailSpin color="#e94560" height={80} width={80} />
					<p className="mt-6 text-lg text-gray-600 font-medium">
						Loading papers...
					</p>
				</div>
			);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<NavBar searchParams={searchParams} />
			<div className="mx-auto px-6 lg:px-10 py-8 lg:py-12">
				<div className="mb-8 lg:mb-12">
					<div className="h-20" />
					<Search searchParams={searchParams} to="/papers" />
				</div>

				{/* Pagination Top */}
				<div className="mb-6">
					<Pagination
						handlePageClick={handlePageClick}
						totalPages={pageCount}
					/>
				</div>

				{/* Content */}
				{chooseBody()}

				{/* Pagination Bottom */}
				{!loading && total > 0 && (
					<div className="mt-8 lg:mt-12">
						<Pagination
							handlePageClick={handlePageClick}
							totalPages={pageCount}
						/>
					</div>
				)}

				{/* Scroll Buttons */}
				<ScrollToTop />
				<ScrollToBottom />
			</div>
		</div>
	);
}

export function ScrollToTop() {
	const scrollToTopButton = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	return (
		<button
			className="scroll-button scroll-button-top"
			onClick={scrollToTopButton}
			type="button"
			aria-label="Scroll to top"
		>
			<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 384 512">
				<title>Scroll to top</title>
				<path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z" />
			</svg>
		</button>
	);
}

export function ScrollToBottom() {
	const scrollToBottomButton = () => {
		window.scrollTo({
			top: document.documentElement.scrollHeight,
			behavior: "smooth",
		});
	};

	return (
		<button
			type="button"
			className="scroll-button scroll-button-bottom"
			onClick={scrollToBottomButton}
			aria-label="Scroll to bottom"
		>
			<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 384 512">
				<title>Scroll to bottom</title>
				<path d="M214.6 410.6c-12.5 12.5-32.8 12.5-45.3 0l-160-160c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 310.8V16c0-17.7 14.3-32 32-32s32 14.3 32 32v294.8l115.4-115.4c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3l-160 160z" />
			</svg>
		</button>
	);
}

export default Papers;
