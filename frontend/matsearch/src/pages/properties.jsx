import NavBar from "../components/navbar";
import "../styles/properties.css";
import { ScrollToBottom, ScrollToTop } from "./papers";
import { useEffect, useState } from "react";
import Search from "../components/search";
import { useLocation, useNavigate } from "react-router-dom";
import Pagination from "../components/pagination";
import { TailSpin } from "react-loader-spinner";
import Content from "../components/mathjax";

function Table({ searchParams, setSearchParams, setPrevUrl, setPaperToUse }) {
	const [time, setTime] = useState(0);
	const [loading, setLoading] = useState(false);
	const [papers, setPapers] = useState([]);
	const [total, setTotal] = useState(0);
	const [pageCount, setPageCount] = useState(0);
	const [highlightedStars, setHighlightedStars] = useState([]);
	const [expandedIndex, setExpandedIndex] = useState(-1);
	const [searchQuery, setSearchQuery] = useState("");

	const location = useLocation();
	const navigate = useNavigate();

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

	const columns = [
		{
			header: "Material",
			key: "MAT",
			icon: (
				<svg
					className="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<title>Material</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
					/>
				</svg>
			),
		},
		{
			header: "Description",
			key: "DSC",
			icon: (
				<svg
					className="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<title>Description</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
			),
		},
		{
			header: "Symmetry/Phase",
			key: "SPL",
			icon: (
				<svg
					className="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<title>Symmetry</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
					/>
				</svg>
			),
		},
		{
			header: "Synthesis",
			key: "SMT",
			icon: (
				<svg
					className="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<title>Synthesis</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
					/>
				</svg>
			),
		},
		{
			header: "Characterization",
			key: "CMT",
			icon: (
				<svg
					className="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<title>Characterization</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
			),
		},
		{
			header: "Property",
			key: "PRO",
			icon: (
				<svg
					className="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<title>Property</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M13 10V3L4 14h7v7l9-11h-7z"
					/>
				</svg>
			),
		},
		{
			header: "Application",
			key: "APL",
			icon: (
				<svg
					className="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<title>Application</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
					/>
				</svg>
			),
		},
		{ header: "", key: null, icon: null },
	];

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

				setPapers(data.papers);
				setTotal(data.total);
				setPageCount(Math.ceil(data.total / searchParams.per_page));
			})
			.catch(() => {
				setTotal(0);
				setPapers([]);
				setPageCount(0);
				setLoading(false);
			});
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

	const handlePageClick = (pageNumber) => {
		setPapers([]);
		changePage(pageNumber);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const changePage = (page) => {
		setSearchParams((prevParams) => ({
			...prevParams,
			page: page,
		}));

		const advStr = encodeURIComponent(JSON.stringify(searchParams.searches));

		navigate(
			`?page=${page}&per_page=${searchParams.per_page}` +
				`&sort=${searchParams.sorting}` +
				`&date=${searchParams.date}` +
				`&searches=${advStr}`,
		);
	};

	const changePaper = (paper) => {
		const id = paper.id.replace("/-/g", "/");

		const advStr = encodeURIComponent(JSON.stringify(searchParams.searches));

		const papers =
			`/properties?page=${searchParams.page}&per_page=${searchParams.per_page}` +
			`&sort=${searchParams.sorting}` +
			`&date=${searchParams.date}` +
			`&searches=${advStr}`;

		setPaperToUse(paper);
		setPrevUrl(papers);
		navigate(`/paper/${id}`);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const toggleExpand = (index) => {
		if (expandedIndex === index) {
			setExpandedIndex(-1);
		} else {
			setExpandedIndex(index);
		}
	};

	const renderCellContent = (row, columnKey, isExpanded) => {
		if (!columnKey) return null;

		const value = row[columnKey];

		if (Array.isArray(value)) {
			if (value.length === 0) {
				return <span className="text-gray-400 italic text-sm">N/A</span>;
			}

			// Limit display to 3 items when collapsed
			const displayItems = isExpanded ? value : value.slice(0, 3);
			const hasMore = value.length > 3;

			return (
				<div className="flex flex-wrap gap-1">
					{displayItems.map((item, index) => (
						<span
							key={`${index}_${item}`}
							className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
						>
							<Content content={item} />
						</span>
					))}
					{!isExpanded && hasMore && (
						<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-gray-500 italic">
							+{value.length - 3} more
						</span>
					)}
				</div>
			);
		}

		if (value) {
			// Truncate text when collapsed
			const text = String(value);
			if (!isExpanded && text.length > 100) {
				return (
					<div>
						<Content
							content={`${text.substring(0, 100)}...`}
							mode="highlightOnly"
						/>
					</div>
				);
			}
			return <Content content={value} mode="highlightOnly" />;
		}

		return <span className="text-gray-400 italic text-sm">N/A</span>;
	};

	const chooseBody = () => {
		if (!loading && total === 0) {
			return (
				<div className="flex flex-col items-center justify-center py-16 lg:py-24">
					<div className="text-center">
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
					{/* Results Header */}
					<div className="bg-gray-50 border border-gray-200 rounded-lg p-4 lg:p-6 mb-6">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
							<div className="flex items-center gap-2 text-sm lg:text-base text-gray-700">
								<svg
									className="w-5 h-5 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Time</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
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
								<title>Query</title>
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
					</div>

					{/* Table */}
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
						<div className="overflow-x-auto">
							<table className="properties-table">
								<thead className="bg-linear-to-r from-slate-900 to-slate-800 text-white">
									<tr>
										{columns.map((column, idx) => (
											<th
												key={column.key || `header-${idx}`}
												className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wider"
											>
												<div className="flex items-center gap-2">
													{column.icon}
													{column.header}
												</div>
											</th>
										))}
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{papers?.map((row, index) => {
										const isExpanded = expandedIndex === index;
										return (
											<tr
												key={`${index}_${row.id}`}
												className={`table-row ${
													isExpanded ? "expanded-row" : ""
												} hover:bg-gray-50 transition-colors duration-200`}
											>
												{columns.map((column, colIdx) => (
													<td
														key={column.key || `cell-${index}-${colIdx}`}
														className={`px-4 py-4 text-sm ${
															column.key
																? "cursor-pointer hover:bg-blue-50"
																: ""
														} ${isExpanded ? "align-top" : ""}`}
														onClick={
															column.key ? () => changePaper(row) : undefined
														}
													>
														{column.key ? (
															<div className="text-gray-700">
																{renderCellContent(row, column.key, isExpanded)}
															</div>
														) : (
															<div className="flex items-center gap-2">
																<button
																	type="button"
																	onClick={(e) => {
																		e.stopPropagation();
																		toggleStar(row);
																	}}
																	className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
																	aria-label={
																		highlightedStars.some(
																			(p) => p.id === row.id,
																		)
																			? "Remove from favorites"
																			: "Add to favorites"
																	}
																>
																	{highlightedStars.some(
																		(p) => p.id === row.id,
																	) ? (
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
																<button
																	type="button"
																	onClick={(e) => {
																		e.stopPropagation();
																		toggleExpand(index);
																	}}
																	className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors duration-200"
																	aria-label={
																		isExpanded ? "Collapse row" : "Expand row"
																	}
																>
																	<svg
																		className="w-5 h-5"
																		fill="none"
																		stroke="currentColor"
																		viewBox="0 0 24 24"
																	>
																		<title>Expand/Shrink</title>
																		{isExpanded ? (
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				strokeWidth={2}
																				d="M5 15l7-7 7 7"
																			/>
																		) : (
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				strokeWidth={2}
																				d="M19 9l-7 7-7-7"
																			/>
																		)}
																	</svg>
																</button>
															</div>
														)}
													</td>
												))}
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			);
		}

		if (loading) {
			return (
				<div className="flex flex-col items-center justify-center py-20 lg:py-32">
					<TailSpin color="#e94560" height={80} width={80} />
					<p className="mt-6 text-lg text-gray-600 font-medium">
						Loading properties...
					</p>
				</div>
			);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<NavBar searchParams={searchParams} />
			<div className="mx-auto px-6 lg:px-10 py-8 lg:py-12">
				{/* Page Header */}
				<div className="mb-8 lg:mb-12">
					<div className="h-20" />
					<Search searchParams={searchParams} to="/properties" />
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

export default Table;
